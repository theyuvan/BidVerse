package com.example.bidverse.Security;

import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Base64;







@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    public static final String SESSION_ATTR = "authenticatedUser";

    private final AppUserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    public WebSocketAuthInterceptor(AppUserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            AuthenticatedUser user = resolveBasicAuth(firstHeader(accessor, "Authorization"));
            if (user == null) {
                return null;
            }

            if (accessor.getSessionAttributes() != null) {
                accessor.getSessionAttributes().put(SESSION_ATTR, user);
            }
        }
        return message;
    }

    private AuthenticatedUser resolveBasicAuth(String header) {
        if (header == null || !header.startsWith("Basic ")) {
            return null;
        }
        try {
            String decoded = new String(
                    Base64.getDecoder().decode(header.substring("Basic ".length()).trim()),
                    StandardCharsets.UTF_8);
            int separator = decoded.indexOf(':');
            if (separator < 0) {
                return null;
            }
            String email = decoded.substring(0, separator);
            String password = decoded.substring(separator + 1);

            AppUserPrincipal principal = (AppUserPrincipal) userDetailsService.loadUserByUsername(email);
            if (!passwordEncoder.matches(password, principal.getPassword())) {
                return null;
            }
            return new AuthenticatedUser(principal.getUserId(), principal.getRole(), principal.getUsername());
        } catch (UsernameNotFoundException | IllegalArgumentException e) {
            return null;
        }
    }

    private String firstHeader(StompHeaderAccessor accessor, String name) {
        var values = accessor.getNativeHeader(name);
        return (values == null || values.isEmpty()) ? null : values.get(0);
    }
}
