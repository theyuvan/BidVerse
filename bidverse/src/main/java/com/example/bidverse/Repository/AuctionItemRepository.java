package com.example.bidverse.Repository;

import com.example.bidverse.Entity.auction_item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * All @Modifying queries here use clearAutomatically + flushAutomatically: without it, a bulk
 * UPDATE doesn't sync back into the persistence context, so a plain findById() called later in
 * the same transaction would silently return the stale, pre-update entity instead of what was
 * actually just written.
 */
public interface AuctionItemRepository extends JpaRepository<auction_item, Long> {

    boolean existsByProductId(Long productId);

    List<auction_item> findByRoomId(Long roomId);

    List<auction_item> findByRoomIdOrderByAuctionItemIdAsc(Long roomId);

    Optional<auction_item> findByRoomIdAndStatus(Long roomId, String status);

    List<auction_item> findByStatus(String status);


    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE auction_item a SET a.currentPrice = :newPrice " +
            "WHERE a.auctionItemId = :id AND a.status = 'live' AND a.currentPrice = :expectedPrice")
    int compareAndSetCurrentPrice(@Param("id") Long id,
                                   @Param("expectedPrice") BigDecimal expectedPrice,
                                   @Param("newPrice") BigDecimal newPrice);


    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE auction_item a SET a.endedAt = :newDeadline " +
            "WHERE a.auctionItemId = :id AND a.status = 'live' AND (a.endedAt IS NULL OR a.endedAt < :newDeadline)")
    int extendDeadlineIfSooner(@Param("id") Long id, @Param("newDeadline") OffsetDateTime newDeadline);


    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE auction_item a SET a.status = 'live', a.startedAt = :startedAt, a.endedAt = :endedAt " +
            "WHERE a.auctionItemId = :id AND a.status = 'waiting'")
    int activateIfWaiting(@Param("id") Long id,
                           @Param("startedAt") OffsetDateTime startedAt,
                           @Param("endedAt") OffsetDateTime endedAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE auction_item a SET a.status = :newStatus WHERE a.auctionItemId = :id AND a.status = 'live'")
    int resolveIfLive(@Param("id") Long id, @Param("newStatus") String newStatus);
}
