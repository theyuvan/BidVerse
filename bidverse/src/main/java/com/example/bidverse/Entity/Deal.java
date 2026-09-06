package com.example.bidverse.Entity;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "deals")
public class Deal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deal_id")
    private Long dealId;
    @Column(name = "auction_item_id", nullable = false)
    private Long auctionItemId;
    @Column(name = "seller_id", nullable = false)
    private Long sellerId;
    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;
    @Column(name = "final_amount", nullable = false)
    private BigDecimal finalPrice;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "cancel_reason")
    private String cancelReason;
    @Column(name = "buyer_status", nullable = false)
    private String buyerStatus;
    @Column(name = "seller_status", nullable = false)
    private String sellerStatus;
}
