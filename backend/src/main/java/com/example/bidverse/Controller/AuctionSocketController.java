package com.example.bidverse.Controller;

import com.example.bidverse.Dto.AuctionUpdate;
import com.example.bidverse.Dto.BidError;
import com.example.bidverse.Dto.BidMessage;
import com.example.bidverse.Security.AuthenticatedUser;
import com.example.bidverse.Security.WebSocketAuthInterceptor;
import com.example.bidverse.Service.AuctionService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class AuctionSocketController {

    private final AuctionService auctionService;
    private final SimpMessagingTemplate messagingTemplate;

    public AuctionSocketController(AuctionService auctionService, SimpMessagingTemplate messagingTemplate) {
        this.auctionService = auctionService;
        this.messagingTemplate = messagingTemplate;
    }


    @SubscribeMapping("/room/{roomId}/status")
    public AuctionUpdate onSubscribe(@DestinationVariable Long roomId) {
        return auctionService.getCurrentState(roomId);
    }

    @MessageMapping("/room/{roomId}/bid")
    public void placeBid(@DestinationVariable Long roomId,
                          @Payload BidMessage message,
                          @Header("simpSessionAttributes") Map<String, Object> sessionAttributes) {
        Object attr = sessionAttributes == null ? null : sessionAttributes.get(WebSocketAuthInterceptor.SESSION_ATTR);
        if (!(attr instanceof AuthenticatedUser user) || !user.hasRole("buyer")) {
            return;
        }

        if (message == null || message.buyerId() == null || !message.buyerId().equals(user.userId())) {
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/buyer/" + user.userId(),
                    new BidError(message == null ? null : message.auctionItemId(),
                            "You may only bid using your own authenticated buyer id"));
            return;
        }

        auctionService.placeBid(roomId, message);
    }

    public record NextRequest(Long auctionItemId) {}

    @MessageMapping("/room/{roomId}/next")
    public void acknowledgeResult(@DestinationVariable Long roomId,
            @Payload NextRequest request,
            @Header("simpSessionAttributes") Map<String, Object> attributes) {
        Object attr = attributes == null ? null : attributes.get(WebSocketAuthInterceptor.SESSION_ATTR);
        if (attr instanceof AuthenticatedUser user && user.hasRole("buyer") && request != null) {
            auctionService.acknowledgeResult(roomId, request.auctionItemId(), user.userId());
        }
    }
}
