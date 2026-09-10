package com.example.bidverse.Config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.cors.DefaultCorsProcessor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CorsConfigTest {
    @ParameterizedTest
    @ValueSource(strings = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"})
    void permitsConfiguredFrontendPreflight(String origin) throws Exception {
        try (var context = new AnnotationConfigApplicationContext(CorsConfig.class)) {
            var request = preflight(origin);
            var response = new MockHttpServletResponse();
            var config = context.getBean(CorsConfig.class).corsConfigurationSource().getCorsConfiguration(request);

            assertTrue(new DefaultCorsProcessor().processRequest(config, request, response));
            assertEquals(origin, response.getHeader("Access-Control-Allow-Origin"));
            assertTrue(response.getHeader("Access-Control-Allow-Headers").toLowerCase().contains("authorization"));
        }
    }

    @Test
    void rejectsUntrustedOrigins() throws Exception {
        try (var context = new AnnotationConfigApplicationContext(CorsConfig.class)) {
            var request = preflight("https://untrusted.example.test");
            var response = new MockHttpServletResponse();
            var config = context.getBean(CorsConfig.class).corsConfigurationSource().getCorsConfiguration(request);

            assertFalse(new DefaultCorsProcessor().processRequest(config, request, response));
            assertEquals(403, response.getStatus());
        }
    }

    @Test
    void explicitOriginConfigurationRemainsRestricted() {
        var cors = new CorsConfig(" https://app.example.test , ");
        var origins = cors.getAllowedOrigins();
        origins[0] = "*";
        assertEquals("https://app.example.test", cors.getAllowedOrigins()[0]);
        var configuration = cors.corsConfigurationSource().getCorsConfiguration(preflight("https://app.example.test"));
        assertEquals("https://app.example.test", configuration.checkOrigin("https://app.example.test"));
        assertEquals(null, configuration.checkOrigin("https://untrusted.example.test"));
    }

    private MockHttpServletRequest preflight(String origin) {
        var request = new MockHttpServletRequest("OPTIONS", "/auth/login");
        request.addHeader("Origin", origin);
        request.addHeader("Access-Control-Request-Method", "POST");
        request.addHeader("Access-Control-Request-Headers", "authorization,content-type");
        return request;
    }
}
