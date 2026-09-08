package com.example.bidverse.Repository;

import com.example.bidverse.Entity.bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<bid, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT INTO bids (auction_item_id, buyer_id, amount, bid_time) " +
            "VALUES (:auctionItemId, :buyerId, :amount, :bidTime) " +
            "ON CONFLICT (auction_item_id, buyer_id) " +
            "DO UPDATE SET amount = EXCLUDED.amount, bid_time = EXCLUDED.bid_time",
            nativeQuery = true)
    void upsertBid(@Param("auctionItemId") Long auctionItemId,
                    @Param("buyerId") Long buyerId,
                    @Param("amount") BigDecimal amount,
                    @Param("bidTime") OffsetDateTime bidTime);

    List<bid> findByAuctionItemIdOrderByAmountDesc(Long auctionItemId);

    Optional<bid> findTopByAuctionItemIdOrderByAmountDesc(Long auctionItemId);

    boolean existsByAuctionItemId(Long auctionItemId);
}
