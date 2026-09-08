package com.example.bidverse.Dto;

import java.math.BigDecimal;

public record AuctionUpdate(
        Long roomId,
        Long auctionItemId,
        Long productId,
        String productName,
        BigDecimal currentPrice,
        Long highestBidderId,
        String itemStatus,
        Long secondsRemaining,
        Long waitingSecondsRemaining,
        String roomStatus,
        String eventType,
        String message
) {
}
