package com.example.bidverse.Controller;

import com.example.bidverse.Dto.AuctionUpdate;
import com.example.bidverse.Dto.BidMessage;
import com.example.bidverse.Service.AuctionService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

@Controller
public class AuctionSocketController {

    private final AuctionService auctionService;

    public AuctionSocketController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }


    @SubscribeMapping("/room/{roomId}/status")
    public AuctionUpdate onSubscribe(@DestinationVariable Long roomId) {
        return auctionService.getCurrentState(roomId);
    }

    @MessageMapping("/room/{roomId}/bid")
    public void placeBid(@DestinationVariable Long roomId, @Payload BidMessage message) {
        auctionService.placeBid(roomId, message);
    }
}
