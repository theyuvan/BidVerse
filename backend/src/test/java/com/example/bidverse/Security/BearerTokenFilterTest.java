package com.example.bidverse.Security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.servlet.FilterChain;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BearerTokenFilterTest {
    @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

    @Test void validTokenRestoresRoleAndIdentity() throws Exception {
        var tokens = new SessionTokens();
        var issued = tokens.issue(new AuthenticatedUser(15L, "buyer", "buyer@example.test"));
        var request = new MockHttpServletRequest();
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);
        request.addHeader("Authorization", "Bearer " + issued.token());
        new BearerTokenFilter(tokens).doFilter(request, response, chain);
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertEquals("buyer@example.test", authentication.getName());
        assertTrue(authentication.getAuthorities().stream().anyMatch(role -> role.getAuthority().equals("ROLE_BUYER")));
        verify(chain).doFilter(request, response);
    }

    @Test void invalidTokenIsRejectedBeforeController() throws Exception {
        var request = new MockHttpServletRequest();
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);
        request.addHeader("Authorization", "Bearer " + "a".repeat(43));
        new BearerTokenFilter(new SessionTokens()).doFilter(request, response, chain);
        assertEquals(401, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(chain);
    }
}
