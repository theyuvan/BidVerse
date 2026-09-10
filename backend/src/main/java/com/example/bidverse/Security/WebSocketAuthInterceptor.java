package com.example.bidverse.Security;

import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    public static final String SESSION_ATTR = "authenticatedUser";
    private static final String TOKEN_ATTR = "sessionAuthorization";
    private final SessionTokens tokens;
    public WebSocketAuthInterceptor(SessionTokens tokens) { this.tokens = tokens; }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;
        if (StompCommand.DISCONNECT.equals(accessor.getCommand())) return message;
        var attributes = accessor.getSessionAttributes();
        String authorization = StompCommand.CONNECT.equals(accessor.getCommand())
                ? accessor.getFirstNativeHeader("Authorization")
                : attributes == null ? null : (String) attributes.get(TOKEN_ATTR);
        AuthenticatedUser user = tokens.resolve(authorization);
        if (user == null || attributes == null) throw new MessagingException("Session expired. Please sign in again.");
        attributes.put(SESSION_ATTR, user);
        attributes.put(TOKEN_ATTR, authorization);
        return message;
    }
}
