package vn.coopfood.kph.kph;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class LocalPrivateMediaStorageTest {

    private static final String STORE_CODE = "0001";
    private static final String STORE_NAME = "Nguyễn Kiệm";
    private static final Instant SERVER_NOW = Instant.parse("2026-01-04T03:04:05Z");

    @TempDir
    Path mediaRoot;

    @Test
    void keepsOriginalBytesAndStampsRotatedImageWithFallbackTimestamp() throws Exception {
        LocalPrivateMediaStorage storage = new LocalPrivateMediaStorage(mediaRoot.toString());
        byte[] original = jpegWithExifOrientation(6, 1600, 900);
        Instant lastModified = Instant.parse("2026-01-03T03:04:05Z");

        LocalPrivateMediaStorage.StoredMedia stored = storage.store(
                UUID.randomUUID(),
                1,
                new MockMultipartFile("photos", "evidence.jpg", "image/jpeg", original),
                STORE_CODE,
                STORE_NAME,
                lastModified,
                SERVER_NOW);

        Path originalPath = mediaRoot.resolve(stored.photo().originalStorageKey());
        Path stampedPath = mediaRoot.resolve(stored.photo().stampedStorageKey());
        assertThat(Files.readAllBytes(originalPath)).containsExactly(original);
        assertThat(stored.photo().originalSha256()).isEqualTo(sha256(original));
        assertThat(stored.capturedAt()).isEqualTo(lastModified);
        assertThat(Files.readAllBytes(stampedPath)).isNotEqualTo(original);
        assertThat(stored.photo().stampedStorageKey()).endsWith(".stamped.jpg");
        // EXIF 6 rotates the 1600x900 source before the 1280x720 envelope is
        // applied, so the resulting portrait derivative is 405x720.
        assertThat(ImageIO.read(stampedPath.toFile()).getWidth()).isEqualTo(405);
        assertThat(ImageIO.read(stampedPath.toFile()).getHeight()).isEqualTo(720);
    }

    @Test
    void usesControlledServerTimeWhenMetadataAndLastModifiedAreMissing() throws Exception {
        LocalPrivateMediaStorage storage = new LocalPrivateMediaStorage(mediaRoot.toString());
        LocalPrivateMediaStorage.StoredMedia stored = storage.store(
                UUID.randomUUID(),
                1,
                new MockMultipartFile("photos", "evidence.png", "image/png", image(600, 400, "png")),
                STORE_CODE,
                STORE_NAME,
                null,
                SERVER_NOW);

        assertThat(stored.capturedAt()).isEqualTo(SERVER_NOW);
        BufferedImage stamped = ImageIO.read(mediaRoot.resolve(stored.photo().stampedStorageKey()).toFile());
        assertThat(stamped.getWidth()).isEqualTo(600);
        assertThat(stamped.getHeight()).isEqualTo(400);
    }

    @Test
    void givesExifCaptureTimePrecedenceOverLastModified() throws Exception {
        LocalPrivateMediaStorage storage = new LocalPrivateMediaStorage(mediaRoot.toString());
        byte[] original = jpegWithExif(1, 600, 400, "2026:01:02 03:04:05");

        LocalPrivateMediaStorage.StoredMedia stored = storage.store(
                UUID.randomUUID(),
                1,
                new MockMultipartFile("photos", "evidence.jpg", "image/jpeg", original),
                STORE_CODE,
                STORE_NAME,
                Instant.parse("2026-01-03T03:04:05Z"),
                SERVER_NOW);

        assertThat(stored.capturedAt()).isEqualTo(Instant.parse("2026-01-01T20:04:05Z"));
    }

    @Test
    void rejectsInvalidMagicBytesBeforeWritingAnything() throws Exception {
        LocalPrivateMediaStorage storage = new LocalPrivateMediaStorage(mediaRoot.toString());
        assertThatThrownBy(() -> storage.store(
                UUID.randomUUID(),
                1,
                new MockMultipartFile("photos", "evidence.jpg", "image/jpeg", "not-an-image".getBytes()),
                STORE_CODE,
                STORE_NAME,
                null,
                SERVER_NOW))
                .isInstanceOf(vn.coopfood.kph.foundation.web.ApiProblemException.class)
                .hasMessageContaining("valid JPEG or PNG");
        try (var files = Files.walk(mediaRoot)) {
            assertThat(files.filter(Files::isRegularFile).toList()).isEmpty();
        }
    }

    @Test
    void rejectsAnUploadThatExceedsTheDecodeBound() {
        LocalPrivateMediaStorage storage = new LocalPrivateMediaStorage(mediaRoot.toString());
        byte[] bytes = new byte[(int) LocalPrivateMediaStorage.MAX_ORIGINAL_BYTES + 1];
        assertThatThrownBy(() -> storage.readBounded(
                new MockMultipartFile("photos", "too-large.jpg", "image/jpeg", bytes)))
                .isInstanceOf(vn.coopfood.kph.foundation.web.ApiProblemException.class)
                .hasMessageContaining("no larger than 10 MiB");
    }

    private static byte[] image(int width, int height, String format) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, Color.RED.getRGB());
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, format, output);
        return output.toByteArray();
    }

    private static byte[] jpegWithExifOrientation(int orientation, int width, int height) throws Exception {
        byte[] jpeg = image(width, height, "jpg");
        byte[] exif = exifSegment(orientation);
        return withExif(jpeg, exif);
    }

    private static byte[] jpegWithExif(int orientation, int width, int height, String captureTime) throws Exception {
        byte[] jpeg = image(width, height, "jpg");
        return withExif(jpeg, exifSegment(orientation, captureTime));
    }

    private static byte[] withExif(byte[] jpeg, byte[] exif) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream(jpeg.length + exif.length + 4);
        output.write(jpeg, 0, 2); // SOI
        output.write(0xff);
        output.write(0xe1); // APP1
        int length = exif.length + 2;
        output.write((length >>> 8) & 0xff);
        output.write(length & 0xff);
        output.write(exif);
        output.write(jpeg, 2, jpeg.length - 2);
        return output.toByteArray();
    }

    private static byte[] exifSegment(int orientation) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        output.write("Exif\0\0".getBytes(StandardCharsets.US_ASCII));
        output.write(new byte[] {'I', 'I', 42, 0, 8, 0, 0, 0});
        output.write(new byte[] {1, 0}); // one IFD entry
        output.write(new byte[] {0x12, 0x01, 0x03, 0x00, 1, 0, 0, 0});
        output.write(new byte[] {(byte) orientation, 0, 0, 0});
        output.write(new byte[] {0, 0, 0, 0}); // next IFD
        return output.toByteArray();
    }

    private static byte[] exifSegment(int orientation, String captureTime) throws Exception {
        byte[] captureBytes = (captureTime + "\0").getBytes(StandardCharsets.US_ASCII);
        if (captureBytes.length != 20) {
            throw new IllegalArgumentException("The synthetic EXIF date must contain 19 ASCII characters.");
        }
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        output.write("Exif\0\0".getBytes(StandardCharsets.US_ASCII));
        output.write(new byte[] {'I', 'I', 42, 0, 8, 0, 0, 0});
        output.write(new byte[] {2, 0}); // orientation + ExifIFD pointer
        output.write(new byte[] {0x12, 0x01, 0x03, 0x00, 1, 0, 0, 0});
        output.write(new byte[] {(byte) orientation, 0, 0, 0});
        output.write(new byte[] {(byte) 0x69, (byte) 0x87, 0x04, 0x00, 1, 0, 0, 0});
        output.write(new byte[] {38, 0, 0, 0}); // ExifIFD starts after IFD0
        output.write(new byte[] {0, 0, 0, 0}); // next IFD
        output.write(new byte[] {1, 0});
        output.write(new byte[] {0x03, (byte) 0x90, 0x02, 0x00, 20, 0, 0, 0});
        output.write(new byte[] {56, 0, 0, 0}); // DateTimeOriginal payload
        output.write(new byte[] {0, 0, 0, 0}); // next IFD
        output.write(captureBytes);
        return output.toByteArray();
    }

    private static String sha256(byte[] bytes) throws Exception {
        return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }
}
