package com.example.bidverse.Entity;
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
    private Double startPrice;
    @Column(name = "current_price", nullable = false)
    private Double currentPrice;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "started_at", nullable = false)
    private String startedAt;
    @Column(name = "ended_at", nullable = false)
    private String endedAt;
}
