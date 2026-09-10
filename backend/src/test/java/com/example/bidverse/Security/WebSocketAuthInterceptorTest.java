package com.example.bidverse.Security;

import java.util.HashMap;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class WebSocketAuthInterceptorTest {
    @Test void connectAuthenticatesAndRevokedTokenCannotBid() {
        var tokens = new SessionTokens();
        var user = new AuthenticatedUser(15L, "buyer", "buyer@example.test");
        var header = "Bearer " + tokens.issue(user).token();
        var interceptor = new WebSocketAuthInterceptor(tokens);
        var channel = mock(MessageChannel.class);
        var attributes = new HashMap<String, Object>();
        var connect = StompHeaderAccessor.create(StompCommand.CONNECT);
        connect.setSessionAttributes(attributes);
        connect.setNativeHeader("Authorization", header);
        connect.setLeaveMutable(true);
        interceptor.preSend(MessageBuilder.createMessage(new byte[0], connect.getMessageHeaders()), channel);
        assertEquals(user, attributes.get(WebSocketAuthInterceptor.SESSION_ATTR));
        tokens.revoke(header);
        var send = StompHeaderAccessor.create(StompCommand.SEND);
        send.setSessionAttributes(attributes);
        send.setLeaveMutable(true);
        var message = MessageBuilder.createMessage(new byte[0], send.getMessageHeaders());
        assertThrows(MessagingException.class, () -> interceptor.preSend(message, channel));
    }
}
