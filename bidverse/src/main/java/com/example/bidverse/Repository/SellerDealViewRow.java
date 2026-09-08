package com.example.bidverse.Repository;

import java.math.BigDecimal;

public interface SellerDealViewRow {
    Long getDealId();
    Long getAuctionItemId();
    Long getRoomId();
    Long getProductId();
    String getProductName();
    String getProductDescription();
    String getImageUrl();
    BigDecimal getFinalPrice();
    String getStatus();
    String getCancelReason();
    String getBuyerStatus();
    String getSellerStatus();
    Long getSellerId();
    Long getBuyerId();
    String getBuyerName();
    String getBuyerEmail();
    String getBuyerPhone();
}
