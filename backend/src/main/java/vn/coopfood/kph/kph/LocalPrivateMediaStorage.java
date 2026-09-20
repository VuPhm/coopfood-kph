package vn.coopfood.kph.kph;

import static vn.coopfood.kph.foundation.time.TimeConfiguration.BUSINESS_ZONE;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoField;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.Tag;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;

import vn.coopfood.kph.foundation.web.ApiProblemException;

/**
 * Local private storage for the online Foundation-01 evidence slice.
 *
 * <p>The original upload is written byte-for-byte. A separate JPEG derivative
 * is generated for the stamped endpoint. The directory is intentionally not a
 * static resource location; callers must go through the authenticated KPH
 * handler.</p>
 */
@Component
class LocalPrivateMediaStorage {

    static final int MAX_WIDTH = 1280;
    static final int MAX_HEIGHT = 720;
    static final long MAX_ORIGINAL_BYTES = 10L * 1024L * 1024L;
    static final long MAX_DECODE_PIXELS = 40_000_000L;
    static final int MAX_DECODE_DIMENSION = 20_000;
    private static final int JPEG_TARGET_BYTES = 550 * 1024;
    private static final float JPEG_QUALITY_FLOOR = 0.45f;

    private static final DateTimeFormatter STAMP_TIME =
            DateTimeFormatter.ofPattern("HH:mm EEEE dd/MM/yyyy", Locale.forLanguageTag("vi-VN"))
                    .withZone(BUSINESS_ZONE);
    private static final DateTimeFormatter EXIF_LOCAL_DATE_TIME = new DateTimeFormatterBuilder()
            .appendPattern("uuuu:MM:dd HH:mm:ss")
            .optionalStart()
            .appendFraction(ChronoField.NANO_OF_SECOND, 0, 9, true)
            .optionalEnd()
            .toFormatter(Locale.ROOT);
    private static final DateTimeFormatter EXIF_OFFSET_DATE_TIME = new DateTimeFormatterBuilder()
            .appendPattern("uuuu:MM:dd HH:mm:ss")
            .optionalStart()
            .appendFraction(ChronoField.NANO_OF_SECOND, 0, 9, true)
            .optionalEnd()
            .appendOffsetId()
            .toFormatter(Locale.ROOT);

    // EXIF OffsetTimeOriginal. metadata-extractor exposes this in newer
    // versions, but retaining the numeric tag keeps this class compatible with
    // the supported 2.x line while still asking the library to decode EXIF.
    private static final int EXIF_OFFSET_TIME_ORIGINAL = 0x9011;

    private final Path root;

    LocalPrivateMediaStorage(@Value("${kph.media-root:./.data/kph-media}") String root) {
        this.root = Path.of(root).toAbsolutePath().normalize();
    }

    /**
     * Stores the exact original and a stamped JPEG derivative.
     *
     * @param fallbackCapturedAt client lastModified metadata, if present
     * @param serverNow controlled server clock used as the final timestamp
     */
    StoredMedia store(UUID recordId, int ordinal, MultipartFile upload,
            String storeCode, String storeName, Instant fallbackCapturedAt, Instant serverNow) {
        byte[] original = readBounded(upload);
        try {
            Metadata metadata = readMetadata(original);
            DetectedImage image = decode(original, metadata);
            Instant capturedAt = captureInstant(metadata)
                    .or(() -> Optional.ofNullable(fallbackCapturedAt))
                    .orElse(serverNow);
            BufferedImage stamped = stamp(image.image(), storeCode, storeName, capturedAt);
            byte[] stampedBytes = encodeJpeg(stamped);
            String extension = "image/png".equals(image.contentType()) ? ".png" : ".jpg";
            String base = "records/" + recordId + "/" + ordinal + "-" + UUID.randomUUID();
            String originalKey = base + ".original" + extension;
            String stampedKey = base + ".stamped.jpg";
            writePrivate(originalKey, original);
            try {
                writePrivate(stampedKey, stampedBytes);
            } catch (RuntimeException exception) {
                delete(originalKey);
                throw exception;
            }
            // The table's content_type describes the stamped representation;
            // the original bytes remain untouched at originalKey.
            KphRepository.StoredPhoto storedPhoto = new KphRepository.StoredPhoto(
                    originalKey, stampedKey, "image/jpeg", original.length, stampedBytes.length,
                    sha256(original), sha256(stampedBytes));
            return new StoredMedia(storedPhoto, capturedAt);
        } catch (ApiProblemException exception) {
            throw exception;
        } catch (IOException | ImageProcessingException | RuntimeException exception) {
            throw invalidImage();
        }
    }

    /**
     * Compatibility overload for package tests that do not need a distinct
     * fallback and server clock.
     */
    KphRepository.StoredPhoto store(UUID recordId, int ordinal, MultipartFile upload,
            String storeCode, String storeName, Instant capturedAt) {
        return store(recordId, ordinal, upload, storeCode, storeName, capturedAt, capturedAt).photo();
    }

    /**
     * Reads a multipart part with a hard byte bound before any metadata or image
     * decoder sees it. This is also used by idempotency fingerprinting.
     */
    byte[] readBounded(MultipartFile upload) {
        if (upload == null || upload.isEmpty()) {
            throw invalidImage();
        }
        long declaredSize = upload.getSize();
        if (declaredSize > MAX_ORIGINAL_BYTES) {
            throw tooLarge();
        }
        try (InputStream input = upload.getInputStream();
                ByteArrayOutputStream output = new ByteArrayOutputStream(initialCapacity(declaredSize))) {
            byte[] buffer = new byte[8192];
            long total = 0;
            int read;
            while ((read = input.read(buffer)) != -1) {
                total += read;
                if (total > MAX_ORIGINAL_BYTES) {
                    throw tooLarge();
                }
                output.write(buffer, 0, read);
            }
            if (total == 0) {
                throw invalidImage();
            }
            return output.toByteArray();
        } catch (ApiProblemException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new ApiProblemException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_PHOTO", "Evidence photo could not be read.");
        }
    }

    byte[] readStamped(String storageKey) {
        Path path = safePath(storageKey);
        try {
            return Files.readAllBytes(path);
        } catch (IOException exception) {
            throw new ApiProblemException(org.springframework.http.HttpStatus.NOT_FOUND,
                    "PHOTO_NOT_FOUND", "The evidence photo does not exist.");
        }
    }

    void delete(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }
        try {
            Files.deleteIfExists(safePath(storageKey));
        } catch (IOException exception) {
            // Cleanup is best effort; the database transaction remains the
            // authority and a later repair can identify an orphan by its key.
        }
    }

    private Metadata readMetadata(byte[] bytes) throws IOException, ImageProcessingException {
        try (InputStream input = new ByteArrayInputStream(bytes)) {
            return ImageMetadataReader.readMetadata(input);
        }
    }

    private DetectedImage decode(byte[] bytes, Metadata metadata) throws IOException {
        try (InputStream input = new ByteArrayInputStream(bytes);
                ImageInputStream imageInput = ImageIO.createImageInputStream(input)) {
            if (imageInput == null) {
                throw invalidImage();
            }
            var readers = ImageIO.getImageReaders(imageInput);
            if (!readers.hasNext()) {
                throw invalidImage();
            }
            ImageReader reader = readers.next();
            try {
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!format.equals("jpeg") && !format.equals("jpg") && !format.equals("png")) {
                    throw invalidImage();
                }
                reader.setInput(imageInput, true, true);
                int sourceWidth = reader.getWidth(0);
                int sourceHeight = reader.getHeight(0);
                validateDimensions(sourceWidth, sourceHeight);
                BufferedImage image = reader.read(0);
                if (image == null) {
                    throw invalidImage();
                }
                int imageOrientation = orientation(metadata);
                return new DetectedImage(applyOrientation(image, imageOrientation),
                        format.equals("png") ? "image/png" : "image/jpeg");
            } finally {
                reader.dispose();
            }
        }
    }

    private static void validateDimensions(int width, int height) {
        if (width < 1 || height < 1 || width > MAX_DECODE_DIMENSION || height > MAX_DECODE_DIMENSION
                || (long) width * height > MAX_DECODE_PIXELS) {
            throw new ApiProblemException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_PHOTO", "Evidence photo dimensions exceed the supported limit.");
        }
    }

    private static int orientation(Metadata metadata) {
        ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
        if (ifd0 == null || !ifd0.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
            return 1;
        }
        Integer value = ifd0.getInteger(ExifIFD0Directory.TAG_ORIENTATION);
        if (value == null || value < 1 || value > 8) {
            throw new ApiProblemException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_PHOTO", "Evidence photo orientation metadata is invalid.");
        }
        return value;
    }

    private static BufferedImage applyOrientation(BufferedImage source, int orientation) {
        if (orientation == 1) {
            return source;
        }
        int width = source.getWidth();
        int height = source.getHeight();
        int outputWidth = orientation >= 5 && orientation <= 8 ? height : width;
        int outputHeight = orientation >= 5 && orientation <= 8 ? width : height;
        int imageType = source.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage output = new BufferedImage(outputWidth, outputHeight, imageType);
        AffineTransform transform = switch (orientation) {
            case 2 -> new AffineTransform(-1, 0, 0, 1, width, 0);
            case 3 -> new AffineTransform(-1, 0, 0, -1, width, height);
            case 4 -> new AffineTransform(1, 0, 0, -1, 0, height);
            // EXIF 5/7 are the transpose/transverse reflections.
            case 5 -> new AffineTransform(0, 1, 1, 0, 0, 0);
            case 6 -> new AffineTransform(0, 1, -1, 0, height, 0);
            case 7 -> new AffineTransform(0, -1, -1, 0, height, width);
            case 8 -> new AffineTransform(0, -1, 1, 0, 0, width);
            default -> throw new IllegalArgumentException("Unsupported EXIF orientation: " + orientation);
        };
        Graphics2D graphics = output.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.drawImage(source, transform, null);
        } finally {
            graphics.dispose();
        }
        return output;
    }

    private static Optional<Instant> captureInstant(Metadata metadata) {
        ExifSubIFDDirectory subIfd = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
        ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);

        List<String> primary = new ArrayList<>();
        if (subIfd != null) {
            primary.add(subIfd.getString(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL));
            primary.add(subIfd.getString(ExifSubIFDDirectory.TAG_DATETIME_DIGITIZED));
        }
        if (ifd0 != null) {
            primary.add(ifd0.getString(ExifIFD0Directory.TAG_DATETIME));
        }
        String offset = subIfd == null ? null : subIfd.getString(EXIF_OFFSET_TIME_ORIGINAL);
        for (String value : primary) {
            Optional<Instant> parsed = parseMetadataDate(value, offset);
            if (parsed.isPresent()) {
                return parsed;
            }
        }

        // XMP/PNG text and other metadata directories expose equivalent dates as
        // tag names/descriptions. The metadata library owns the container
        // parsing; this loop only applies the contract's precedence to decoded
        // text values.
        String[] equivalentNames = {
                "Date/Time Original", "Date/Time Digitized", "Date/Time",
                "Create Date", "Creation Time", "Date Created", "Modify Date",
                "File Modification Date", "File Modified Date"
        };
        for (String name : equivalentNames) {
            for (Directory directory : metadata.getDirectories()) {
                for (Tag tag : directory.getTags()) {
                    if (tag.getTagName().equalsIgnoreCase(name)) {
                        Optional<Instant> parsed = parseMetadataDate(tag.getDescription(), null);
                        if (parsed.isPresent()) {
                            return parsed;
                        }
                    }
                }
            }
        }
        for (Directory directory : metadata.getDirectories()) {
            for (Tag tag : directory.getTags()) {
                String tagName = tag.getTagName().toLowerCase(Locale.ROOT);
                if (tagName.contains("date") || tagName.contains("time")
                        || tagName.contains("create") || tagName.contains("modify")) {
                    Optional<Instant> parsed = parseMetadataDate(tag.getDescription(), null);
                    if (parsed.isPresent()) {
                        return parsed;
                    }
                }
            }
        }
        return Optional.empty();
    }

    private static Optional<Instant> parseMetadataDate(String value, String offset) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        String text = value.replace('\u0000', ' ').trim();
        List<java.util.function.Supplier<Instant>> parsers = new ArrayList<>();
        parsers.add(() -> Instant.parse(text));
        parsers.add(() -> OffsetDateTime.parse(text, DateTimeFormatter.ISO_OFFSET_DATE_TIME).toInstant());
        if (offset != null && !offset.isBlank()) {
            parsers.add(() -> LocalDateTime.parse(text, EXIF_LOCAL_DATE_TIME)
                    .atOffset(ZoneOffset.of(offset.trim())).toInstant());
        }
        parsers.add(() -> OffsetDateTime.parse(text, EXIF_OFFSET_DATE_TIME).toInstant());
        parsers.add(() -> LocalDateTime.parse(text, EXIF_LOCAL_DATE_TIME).atZone(BUSINESS_ZONE).toInstant());
        parsers.add(() -> LocalDateTime.parse(text, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                .atZone(BUSINESS_ZONE).toInstant());
        for (var parser : parsers) {
            try {
                return Optional.of(parser.get());
            } catch (DateTimeParseException | IllegalArgumentException ignored) {
                // Try the next metadata representation, then fall back to the
                // client lastModified or controlled server clock.
            }
        }
        return Optional.empty();
    }

    private static BufferedImage stamp(
            BufferedImage source, String storeCode, String storeName, Instant capturedAt) {
        double scale = Math.min(1d, Math.min((double) MAX_WIDTH / source.getWidth(),
                (double) MAX_HEIGHT / source.getHeight()));
        int width = Math.max(1, (int) Math.round(source.getWidth() * scale));
        int height = Math.max(1, (int) Math.round(source.getHeight() * scale));
        BufferedImage output = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = output.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.drawImage(source, 0, 0, width, height, null);
            String firstLine = STAMP_TIME.format(capturedAt);
            String secondLine = storeCode + " " + storeName;
            int fontSize = Math.max(1, Math.min(28, Math.max(1, Math.min(width, height) / 36)));
            graphics.setFont(new Font(Font.SANS_SERIF, Font.BOLD, fontSize));
            int padding = Math.max(1, Math.min(8, fontSize / 2));
            int lineHeight = fontSize + 2;
            int maxTextWidth = Math.max(1, width - padding * 2);
            firstLine = fitText(graphics, firstLine, maxTextWidth);
            secondLine = fitText(graphics, secondLine, maxTextWidth);
            int boxWidth = Math.min(width, Math.max(graphics.getFontMetrics().stringWidth(firstLine),
                    graphics.getFontMetrics().stringWidth(secondLine)) + padding * 2);
            int boxHeight = Math.min(height, lineHeight * 2 + padding * 2);
            int x = 0;
            int y = Math.max(0, height - boxHeight);
            graphics.setComposite(AlphaComposite.SrcOver);
            graphics.setColor(new Color(0, 0, 0, 170));
            graphics.fillRoundRect(x, y, boxWidth, boxHeight, Math.min(12, boxHeight), Math.min(12, boxHeight));
            graphics.setColor(Color.WHITE);
            graphics.drawString(firstLine, Math.min(padding, Math.max(0, boxWidth - 1)),
                    Math.min(height - 1, y + padding + fontSize));
            graphics.drawString(secondLine, Math.min(padding, Math.max(0, boxWidth - 1)),
                    Math.min(height - 1, y + padding + lineHeight + fontSize));
        } finally {
            graphics.dispose();
        }
        return output;
    }

    private static String fitText(Graphics2D graphics, String value, int maxWidth) {
        if (graphics.getFontMetrics().stringWidth(value) <= maxWidth) {
            return value;
        }
        String ellipsis = "…";
        StringBuilder fitted = new StringBuilder(value);
        while (fitted.length() > 1
                && graphics.getFontMetrics().stringWidth(fitted + ellipsis) > maxWidth) {
            fitted.deleteCharAt(fitted.length() - 1);
        }
        if (graphics.getFontMetrics().stringWidth(ellipsis) > maxWidth) {
            return "";
        }
        return fitted + ellipsis;
    }

    private static byte[] encodeJpeg(BufferedImage image) throws IOException {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        try {
            float quality = 0.85f;
            while (true) {
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                try (ImageOutputStream imageOutput = ImageIO.createImageOutputStream(output)) {
                    writer.reset();
                    ImageWriteParam writeParam = writer.getDefaultWriteParam();
                    writeParam.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    writeParam.setCompressionQuality(quality);
                    writer.setOutput(imageOutput);
                    writer.write(null, new IIOImage(image, null, null), writeParam);
                }
                byte[] encoded = output.toByteArray();
                if (encoded.length <= JPEG_TARGET_BYTES || quality <= JPEG_QUALITY_FLOOR) {
                    return encoded;
                }
                quality = Math.max(JPEG_QUALITY_FLOOR, quality - 0.10f);
            }
        } finally {
            writer.dispose();
        }
    }

    private void writePrivate(String storageKey, byte[] bytes) {
        Path target = safePath(storageKey);
        try {
            Files.createDirectories(target.getParent());
            Path temporary = Files.createTempFile(target.getParent(), ".upload-", ".tmp");
            try {
                Files.write(temporary, bytes);
                try {
                    Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE);
                } catch (AtomicMoveNotSupportedException exception) {
                    Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING);
                }
            } finally {
                Files.deleteIfExists(temporary);
            }
        } catch (IOException exception) {
            throw new ApiProblemException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "MEDIA_STORAGE_UNAVAILABLE", "Evidence photo storage is unavailable.");
        }
    }

    private Path safePath(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            throw new ApiProblemException(org.springframework.http.HttpStatus.NOT_FOUND,
                    "PHOTO_NOT_FOUND", "The evidence photo does not exist.");
        }
        Path path = root.resolve(storageKey).normalize();
        if (!path.startsWith(root)) {
            throw new ApiProblemException(org.springframework.http.HttpStatus.NOT_FOUND,
                    "PHOTO_NOT_FOUND", "The evidence photo does not exist.");
        }
        return path;
    }

    private static int initialCapacity(long declaredSize) {
        if (declaredSize <= 0 || declaredSize > Integer.MAX_VALUE) {
            return 8192;
        }
        return (int) Math.min(declaredSize, MAX_ORIGINAL_BYTES);
    }

    private static String sha256(byte[] bytes) {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256");
            return java.util.HexFormat.of().formatHex(digest.digest(bytes));
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static ApiProblemException invalidImage() {
        return new ApiProblemException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                "INVALID_PHOTO", "Each evidence photo must be a valid JPEG or PNG image.");
    }

    private static ApiProblemException tooLarge() {
        return new ApiProblemException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                "PHOTO_TOO_LARGE", "Each evidence photo must be no larger than 10 MiB.");
    }

    private record DetectedImage(BufferedImage image, String contentType) {
    }

    record StoredMedia(KphRepository.StoredPhoto photo, Instant capturedAt) {
    }
}
