package com.example.bidverse.Repository;

import java.math.BigDecimal;

public interface BuyerWonDealRow {
    Long getDealId();
    Long getAuctionItemId();
    Long getRoomId();
    Long getProductId();
    String getProductName();
    String getProductDescription();
    String getImageUrl();
    BigDecimal getFinalPrice();
    String getDealStatus();
    String getBuyerStatus();
    String getSellerStatus();
    Long getSellerId();
    String getSellerName();
    String getSellerEmail();
    String getSellerPhone();
}
