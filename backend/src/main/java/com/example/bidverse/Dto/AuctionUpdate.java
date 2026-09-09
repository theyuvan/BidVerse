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
        String message,
        String winningBuyerName,
        Long intermissionSecondsRemaining,
        Long nextProductId,
        String nextProductName,
        String nextImageUrl,
        java.time.OffsetDateTime intermissionEndsAt,
        java.util.Set<Long> readyBuyerIds,
        Integer participantCount
) {
    public AuctionUpdate(Long roomId, Long auctionItemId, Long productId, String productName,
            BigDecimal currentPrice, Long highestBidderId, String itemStatus, Long secondsRemaining,
            Long waitingSecondsRemaining, String roomStatus, String eventType, String message,
            String winningBuyerName, Long intermissionSecondsRemaining, Long nextProductId,
            String nextProductName, String nextImageUrl) {
        this(roomId, auctionItemId, productId, productName, currentPrice, highestBidderId, itemStatus,
                secondsRemaining, waitingSecondsRemaining, roomStatus, eventType, message,
                winningBuyerName, intermissionSecondsRemaining, nextProductId, nextProductName,
                nextImageUrl, null, java.util.Set.of(), 0);
    }
}
