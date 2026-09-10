package com.example.bidverse.Security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionTokens {
    public record Issued(String token, Instant expiresAt) {}
    private record Session(AuthenticatedUser user, Instant expiresAt) {}
    private final ConcurrentHashMap<String, Session> sessions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final Clock clock;
    private final Duration lifetime;

    @Autowired
    public SessionTokens() { this(Clock.systemUTC(), Duration.ofHours(1)); }
    SessionTokens(Clock clock, Duration lifetime) { this.clock = clock; this.lifetime = lifetime; }

    public synchronized Issued issue(AuthenticatedUser user) {
        sessions.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(clock.instant()));
        if (sessions.size() >= 10000) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Please try signing in later");
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt = clock.instant().plus(lifetime);
        sessions.put(digest(token), new Session(user, expiresAt));
        return new Issued(token, expiresAt);
    }

    public AuthenticatedUser resolve(String header) {
        String key = key(header);
        if (key == null) return null;
        Session session = sessions.get(key);
        if (session == null) return null;
        if (!session.expiresAt().isAfter(clock.instant())) { sessions.remove(key, session); return null; }
        return session.user();
    }

    public void revoke(String header) { String key = key(header); if (key != null) sessions.remove(key); }

    private String key(String header) {
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        return token.matches("[A-Za-z0-9_-]{43}") ? digest(token) : null;
    }

    private String digest(String token) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.US_ASCII))); }
        catch (java.security.NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
    }
}
