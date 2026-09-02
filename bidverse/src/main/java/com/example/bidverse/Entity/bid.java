package com.example.bidverse.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.OffsetDateTime;
import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "bids")
public class bid {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bid_id")
    private Long bidId;
    @Column(name = "auction_item_id", nullable = false)
    private Long auctionItemId;
    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;
    @Column(name = "amount", nullable = false)
    private BigDecimal Amount;
    @Column(name = "bid_time", nullable = false)
    private OffsetDateTime bidTime;
}
