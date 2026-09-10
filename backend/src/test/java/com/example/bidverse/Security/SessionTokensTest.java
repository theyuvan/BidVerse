package com.example.bidverse.Security;

import org.junit.jupiter.api.Test;
import java.time.Clock;
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.*;

class SessionTokensTest {
    private final AuthenticatedUser buyer = new AuthenticatedUser(21L, "buyer", "buyer@example.test");

    @Test void uniqueTokensResolveOnlyToTheirAuthenticatedUser() {
        var tokens = new SessionTokens();
        var first = tokens.issue(buyer);
        var second = tokens.issue(buyer);
        assertNotEquals(first.token(), second.token());
        assertEquals(43, first.token().length());
        assertEquals(buyer, tokens.resolve("Bearer " + first.token()));
        assertNull(tokens.resolve("Bearer " + "a".repeat(43)));
        assertNull(tokens.resolve("Basic credentials"));
        assertNull(tokens.resolve(null));
        assertFalse(first.token().contains(buyer.email()));
    }

    @Test void logoutRevokesOnlyThatSession() {
        var tokens = new SessionTokens();
        var first = tokens.issue(buyer);
        var second = tokens.issue(buyer);
        tokens.revoke("Bearer " + first.token());
        assertNull(tokens.resolve("Bearer " + first.token()));
        assertEquals(buyer, tokens.resolve("Bearer " + second.token()));
    }

    @Test void expiredSessionIsRejected() {
        var tokens = new SessionTokens(Clock.systemUTC(), Duration.ofSeconds(-1));
        var expired = tokens.issue(buyer);
        assertNull(tokens.resolve("Bearer " + expired.token()));
    }
}
