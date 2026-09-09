package com.example.bidverse.Dto;

import java.math.BigDecimal;





public record BidMessage(
        Long auctionItemId, Long buyerId, String mode, BigDecimal amount) {
}
