package com.example.bidverse.Repository;

import java.math.BigDecimal;

public interface RoomProductRow {
    Long getAuctionItemId();
    Long getProductId();
    String getName();
    String getDescription();
    BigDecimal getBasePrice();
    String getAuctionStatus();
}
