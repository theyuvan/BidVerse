package com.example.bidverse.Service;

import com.example.bidverse.Security.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
public class ProductImageStorage {
    public static final int MAX_BYTES = 2 * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "image/gif", "gif");
    private final String url;
    private final String key;
    private final String bucket;
    private final HttpClient http;

    @Autowired
    public ProductImageStorage(@Value("${SUPABASE_URL:}") String url,
                               @Value("${SUPABASE_SERVICE_ROLE_KEY:}") String key,
                               @Value("${SUPABASE_PRODUCT_BUCKET:Products}") String bucket) {
        this(url, key, bucket, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
    }

    ProductImageStorage(String url, String key, String bucket, HttpClient http) {
        this.url = url.trim().replaceAll("/+$", "");
        this.key = key.trim();
        this.bucket = bucket.trim();
        this.http = http;
    }

    public String upload(AuthenticatedUser seller, MultipartFile file) {
        if (seller == null || !seller.hasRole("seller") || seller.userId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only signed-in sellers can upload product images.");
        }
        if (file == null || file.isEmpty()) throw badFile("Choose an image to upload.");
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image must be 2 MB or smaller.");
        }
        String extension = EXTENSIONS.get(file.getContentType() == null ? "" : file.getContentType());
        if (extension == null) throw badFile("Use a PNG, JPG, WEBP, or GIF image.");
        validateConfiguration();

        try {
            byte[] bytes = file.getBytes();
            if (bytes.length > MAX_BYTES) throw badFile("Image must be 2 MB or smaller.");
            if (!matchesSignature(extension, bytes)) throw badFile("The file contents do not match the selected image format.");
            String objectPath = encode(bucket) + "/seller-" + seller.userId() + "/" + UUID.randomUUID() + "." + extension;
            HttpRequest request = HttpRequest.newBuilder(URI.create(url + "/storage/v1/object/" + objectPath))
                    .timeout(Duration.ofSeconds(30))
                    .header("apikey", key)
                    .header("Authorization", "Bearer " + key)
                    .header("Content-Type", file.getContentType())
                    .header("x-upsert", "false")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(bytes)).build();
            HttpResponse<Void> response = http.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {

                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Image storage rejected the upload. Check the backend Supabase service-role key, Products bucket, and bucket file restrictions.");
            }
            return url + "/storage/v1/object/public/" + objectPath;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Image upload was interrupted. Please try again.");
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to reach image storage. Please try again.");
        }
    }

    private void validateConfiguration() {
        try {
            URI endpoint = URI.create(url);
            if (!"https".equals(endpoint.getScheme()) || endpoint.getHost() == null
                    || endpoint.getUserInfo() != null || endpoint.getQuery() != null || endpoint.getFragment() != null
                    || !endpoint.getPath().isEmpty() || key.isBlank() || bucket.isBlank()) throw new IllegalArgumentException();
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Image uploads are not configured on the backend. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then restart the backend. You can still paste an existing public image URL.");
        }
    }

    private static boolean matchesSignature(String extension, byte[] bytes) {
        if (bytes.length < 12) return false;
        return switch (extension) {
            case "jpg" -> (bytes[0] & 255) == 255 && (bytes[1] & 255) == 216 && (bytes[2] & 255) == 255;
            case "png" -> (bytes[0] & 255) == 137 && bytes[1] == 80 && bytes[2] == 78 && bytes[3] == 71
                    && bytes[4] == 13 && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10;
            case "gif" -> new String(bytes, 0, 6, StandardCharsets.US_ASCII).matches("GIF8[79]a");
            case "webp" -> new String(bytes, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                    && new String(bytes, 8, 4, StandardCharsets.US_ASCII).equals("WEBP");
            default -> false;
        };
    }

    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20"); }
    private static ResponseStatusException badFile(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
