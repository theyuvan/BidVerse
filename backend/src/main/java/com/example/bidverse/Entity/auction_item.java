package com.example.bidverse.Entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "auction_items")
public class auction_item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "auction_item_id")
    private Long auctionItemId;
    @Column(name = "room_id", nullable = false)
    private Long roomId;
    @Column(name = "product_id", nullable = false)
    private Long productId;
    @Column(name = "start_price", nullable = false)
    private BigDecimal startPrice;
    @Column(name = "current_price", nullable = false)
    private BigDecimal currentPrice;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "started_at")
    private OffsetDateTime startedAt;
    @Column(name = "ended_at")
    private OffsetDateTime endedAt;

    public auction_item(
            Long auctionItemId,
            Long roomId,
            Long productId,
            BigDecimal startPrice,
            BigDecimal currentPrice,
            String status,
            OffsetDateTime startedAt,
            OffsetDateTime endedAt
    ) {
        this.auctionItemId = auctionItemId;
        this.roomId = roomId;
        this.productId = productId;
        this.startPrice = startPrice;
        this.currentPrice = currentPrice;
        this.status = status;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
    }
}
