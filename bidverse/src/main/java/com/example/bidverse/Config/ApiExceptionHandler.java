package com.example.bidverse.Config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Every service in this app throws ResponseStatusException with a deliberate, user-facing
 * reason ("Buyer already has a seat booked in this room", "role must be buyer or seller", ...).
 * Spring Boot's default error body drops that reason under some configurations (the
 * server.error.include-message property doesn't reliably surface it here), leaving the
 * frontend with nothing but the generic HTTP reason phrase ("Conflict", "Bad Request").
 * Handling it explicitly guarantees the real message always reaches the client.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        String message = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);

        return ResponseEntity.status(status).body(body);
    }
}
