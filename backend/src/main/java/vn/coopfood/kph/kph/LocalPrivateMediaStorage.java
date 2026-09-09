package vn.coopfood.kph.kph;

import static vn.coopfood.kph.foundation.time.TimeConfiguration.BUSINESS_ZONE;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import vn.coopfood.kph.identity.StoreContext;
import vn.coopfood.kph.foundation.web.ApiProblemException;

@Component
class LocalPrivateMediaStorage {

    private static final int MAX_WIDTH = 1280;
    private static final int MAX_HEIGHT = 720;
    private static final DateTimeFormatter STAMP_TIME =
            DateTimeFormatter.ofPattern("HH:mm EEEE dd/MM/yyyy", Locale.forLanguageTag("vi-VN"))
                    .withZone(BUSINESS_ZONE);

    private final Path root;

    LocalPrivateMediaStorage(@Value("${kph.media-root:./.data/kph-media}") String root) {
        this.root = Path.of(root).toAbsolutePath().normalize();
    }

    KphRepository.StoredPhoto store(UUID recordId, int ordinal, MultipartFile upload,
            StoreContext store, Instant capturedAt) {
        try {
            byte[] original = upload.getBytes();
            DetectedImage image = decode(original);
            BufferedImage stamped = stamp(image.image(), store, capturedAt);
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
            // The table's content_type describes the stamped representation; the original
            // bytes remain at originalKey and retain their PNG/JPEG extension.
            return new KphRepository.StoredPhoto(originalKey, stampedKey, "image/jpeg", original.length,
                    stampedBytes.length, sha256(original), sha256(stampedBytes));
        } catch (IOException exception) {
            throw new ApiProblemException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_PHOTO", "Evidence photo could not be read or encoded.");
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
        try {
            Files.deleteIfExists(safePath(storageKey));
        } catch (IOException exception) {
            // Cleanup is best effort; the database transaction remains the authority.
        }
    }

    private DetectedImage decode(byte[] bytes) throws IOException {
        try (InputStream input = new java.io.ByteArrayInputStream(bytes);
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
                reader.setInput(imageInput);
                BufferedImage image = reader.read(0);
                if (image == null) {
                    throw invalidImage();
                }
                return new DetectedImage(image, format.equals("png") ? "image/png" : "image/jpeg");
            } finally {
                reader.dispose();
            }
        }
    }

    private BufferedImage stamp(BufferedImage source, StoreContext store, Instant capturedAt) {
        double scale = Math.min(1d, Math.min((double) MAX_WIDTH / source.getWidth(), (double) MAX_HEIGHT / source.getHeight()));
        int width = Math.max(1, (int) Math.round(source.getWidth() * scale));
        int height = Math.max(1, (int) Math.round(source.getHeight() * scale));
        BufferedImage output = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = output.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.drawImage(source, 0, 0, width, height, null);
            String firstLine = STAMP_TIME.format(capturedAt);
            String secondLine = store.code() + " " + store.name();
            int fontSize = Math.max(12, Math.min(28, width / 36));
            graphics.setFont(new Font(Font.SANS_SERIF, Font.BOLD, fontSize));
            int padding = Math.max(8, fontSize / 2);
            int lineHeight = fontSize + 6;
            int boxWidth = Math.min(width - padding * 2, Math.max(graphics.getFontMetrics().stringWidth(firstLine),
                    graphics.getFontMetrics().stringWidth(secondLine)) + padding * 2);
            int boxHeight = lineHeight * 2 + padding * 2;
            int x = padding;
            int y = height - boxHeight - padding;
            graphics.setComposite(AlphaComposite.SrcOver);
            graphics.setColor(new Color(0, 0, 0, 170));
            graphics.fillRoundRect(x, y, boxWidth, boxHeight, 12, 12);
            graphics.setColor(Color.WHITE);
            graphics.drawString(firstLine, x + padding, y + padding + fontSize);
            graphics.drawString(secondLine, x + padding, y + padding + lineHeight + fontSize);
        } finally {
            graphics.dispose();
        }
        return output;
    }

    private byte[] encodeJpeg(BufferedImage image) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        if (!ImageIO.write(image, "jpeg", output)) {
            throw new IOException("JPEG encoder is unavailable");
        }
        return output.toByteArray();
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

    private record DetectedImage(BufferedImage image, String contentType) {
    }
}
