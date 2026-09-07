package com.example.bidverse.Repository;

import java.math.BigDecimal;

public interface CatalogItemRow {

    Long getAuctionItemId();

    Long getProductId();

    String getProductName();

    String getDescription();

    BigDecimal getBasePrice();

    String getCategoryName();
    String getImageUrl();
}
