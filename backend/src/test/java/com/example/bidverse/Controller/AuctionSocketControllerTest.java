package com.example.bidverse.Controller;

import com.example.bidverse.Security.AuthenticatedUser;
import com.example.bidverse.Security.WebSocketAuthInterceptor;
import com.example.bidverse.Service.AuctionService;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.Map;
import static org.mockito.Mockito.*;

class AuctionSocketControllerTest {
    @Test
    void nextUsesAuthenticatedBuyerIdentity() {
        AuctionService service = mock(AuctionService.class);
        var controller = new AuctionSocketController(service, mock(SimpMessagingTemplate.class));
        controller.acknowledgeResult(5L, new AuctionSocketController.NextRequest(11L),
                Map.of(WebSocketAuthInterceptor.SESSION_ATTR, new AuthenticatedUser(21L, "buyer", "buyer@example.com")));
        verify(service).acknowledgeResult(5L, 11L, 21L);
    }

    @Test
    void hostSellerAndAnonymousCannotAcknowledgeForBuyers() {
        AuctionService service = mock(AuctionService.class);
        var controller = new AuctionSocketController(service, mock(SimpMessagingTemplate.class));
        for (String role : new String[]{"host", "seller"}) {
            controller.acknowledgeResult(5L, new AuctionSocketController.NextRequest(11L),
                    Map.of(WebSocketAuthInterceptor.SESSION_ATTR, new AuthenticatedUser(21L, role, "preview@example.com")));
        }
        controller.acknowledgeResult(5L, new AuctionSocketController.NextRequest(11L), null);
        verifyNoInteractions(service);
    }
}
