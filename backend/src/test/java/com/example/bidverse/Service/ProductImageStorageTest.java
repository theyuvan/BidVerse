package com.example.bidverse.Service;

import com.example.bidverse.Security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProductImageStorageTest {
    private final HttpClient http = mock(HttpClient.class);
    private final ProductImageStorage storage = new ProductImageStorage("https://example.supabase.co", "server-only-test-key", "Products", http);
    private final AuthenticatedUser seller = new AuthenticatedUser(22L, "seller", "seller@example.com");
    private MockMultipartFile image() {
        return new MockMultipartFile("file", "../../seller-99/photo.png", "image/png",
                new byte[]{(byte)137,80,78,71,13,10,26,10,0,0,0,0});
    }

    @Test
    void uploadUsesAuthenticatedSellerAndReturnsPublicUrl() throws Exception {
        @SuppressWarnings("unchecked") HttpResponse<Void> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(http.send(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<Void>>any())).thenReturn(response);
        String result = storage.upload(seller, image());
        assertTrue(result.startsWith("https://example.supabase.co/storage/v1/object/public/Products/seller-22/"));
        assertTrue(result.endsWith(".png"));
        assertFalse(result.contains("seller-99"));
        assertFalse(result.contains("server-only-test-key"));
        var request = org.mockito.ArgumentCaptor.forClass(HttpRequest.class);
        verify(http).send(request.capture(), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<Void>>any());
        assertEquals("POST", request.getValue().method());
        assertEquals("false", request.getValue().headers().firstValue("x-upsert").orElseThrow());
        assertEquals("Bearer server-only-test-key", request.getValue().headers().firstValue("Authorization").orElseThrow());
    }

    @Test
    void missingConfigurationIsActionableWithoutContactingStorage() {
        var unconfigured = new ProductImageStorage("", "", "Products", http);
        var error = assertThrows(ResponseStatusException.class, () -> unconfigured.upload(seller, image()));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
        assertTrue(error.getReason().contains("SUPABASE_SERVICE_ROLE_KEY"));
        verifyNoInteractions(http);
    }

    @Test
    void anonymousAndNonSellerCannotUpload() {
        for (var role : new String[]{"buyer", "host"}) {
            assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class, () ->
                    storage.upload(new AuthenticatedUser(1L, role, "test@example.com"), image())).getStatusCode());
        }
        assertThrows(ResponseStatusException.class, () -> storage.upload(null, image()));
        verifyNoInteractions(http);
    }

    @Test
    void oversizedEmptyAndSpoofedImagesAreRejected() {
        var oversized = new MockMultipartFile("file", "big.png", "image/png", new byte[ProductImageStorage.MAX_BYTES + 1]);
        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, assertThrows(ResponseStatusException.class, () -> storage.upload(seller, oversized)).getStatusCode());
        var spoof = new MockMultipartFile("file", "fake.png", "image/png", "<script>bad data</script>".getBytes());
        assertThrows(ResponseStatusException.class, () -> storage.upload(seller, spoof));
        var svg = new MockMultipartFile("file", "image.svg", "image/svg+xml", "<svg/>".getBytes());
        assertThrows(ResponseStatusException.class, () -> storage.upload(seller, svg));
        assertThrows(ResponseStatusException.class, () -> storage.upload(seller, new MockMultipartFile("file", new byte[0])));
        verifyNoInteractions(http);
    }

    @Test
    void storageFailureDoesNotLeakSecretsOrClaimSuccess() throws Exception {
        @SuppressWarnings("unchecked") HttpResponse<Void> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(400);
        when(http.send(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<Void>>any())).thenReturn(response);
        var error = assertThrows(ResponseStatusException.class, () -> storage.upload(seller, image()));
        assertEquals(HttpStatus.BAD_GATEWAY, error.getStatusCode());
        assertFalse(error.getReason().contains("server-only-test-key"));
    }

    @Test
    void networkFailureIsReportedWithoutLeakingExceptionDetails() throws Exception {
        when(http.send(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<Void>>any())).thenThrow(new IOException("sensitive upstream detail"));
        var error = assertThrows(ResponseStatusException.class, () -> storage.upload(seller, image()));
        assertEquals(HttpStatus.BAD_GATEWAY, error.getStatusCode());
        assertFalse(error.getReason().contains("sensitive"));
    }
}
