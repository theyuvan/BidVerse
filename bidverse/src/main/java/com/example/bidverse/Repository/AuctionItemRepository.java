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

    @Query(value = """
            select
                ai.auction_item_id as "auctionItemId",
                p.product_id       as "productId",
                p.name             as "name",
                p.description      as "description",
                p.base_price       as "basePrice",
                ai.status          as "auctionStatus",
                p.image_url        as "imageUrl"
            from auction_items ai
            join products p on p.product_id = ai.product_id
            where ai.room_id = :roomId
            order by ai.auction_item_id
            """, nativeQuery = true)
    List<RoomProductRow> findRoomProductsByRoomId(@Param("roomId") Long roomId);

    @Query(value = """
            select
                ai.auction_item_id as "auctionItemId",
                p.product_id       as "productId",
                p.name             as "productName",
                p.description      as "description",
                c.category_id      as "categoryId",
                c.name             as "categoryName",
                p.base_price       as "basePrice",
                ai.current_price   as "currentPrice",
                ai.status          as "auctionStatus",
                p.image_url        as "imageUrl"
            from auction_items ai
            join products p on p.product_id = ai.product_id
            join categories c on c.category_id = p.category_id
            where ai.room_id = :roomId
            order by ai.auction_item_id
            """, nativeQuery = true)
    List<CatalogItemRow> findCatalogByRoomId(@Param("roomId") Long roomId);

    @Query(value = """
            select
                ai.auction_item_id as "auctionItemId",
                p.product_id       as "productId",
                p.name             as "productName",
                c.name             as "categoryName",
                seller.name        as "sellerName",
                p.base_price       as "basePrice",
                ai.current_price   as "currentPrice",
                ai.status          as "auctionStatus",
                p.image_url        as "imageUrl"
            from auction_items ai
            join products p on p.product_id = ai.product_id
            join categories c on c.category_id = p.category_id
            join users seller on seller.user_id = p.seller_id
            where ai.room_id = :roomId
            order by ai.auction_item_id
            """, nativeQuery = true)
    List<LiveAuctionItemRow> findLiveAuctionItemsByRoomId(@Param("roomId") Long roomId);

    List<auction_item> findByRoomIdOrderByAuctionItemIdAsc(Long roomId);

    Optional<auction_item> findByRoomIdAndStatus(Long roomId, String status);

    List<auction_item> findByStatus(String status);


    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE auction_item a SET a.currentPrice = :newPrice, a.endedAt = :newDeadline " +
            "WHERE a.auctionItemId = :id AND a.status = 'live' " +
            "AND a.currentPrice = :expectedPrice AND a.endedAt > :bidTime")
    int acceptBidAndResetDeadline(@Param("id") Long id,
                                  @Param("expectedPrice") BigDecimal expectedPrice,
                                  @Param("newPrice") BigDecimal newPrice,
                                  @Param("bidTime") OffsetDateTime bidTime,
                                  @Param("newDeadline") OffsetDateTime newDeadline);


    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE auction_item a SET a.status = 'live', a.startedAt = :startedAt, a.endedAt = :endedAt " +
            "WHERE a.auctionItemId = :id AND a.status = 'waiting'")
    int activateIfWaiting(@Param("id") Long id,
                           @Param("startedAt") OffsetDateTime startedAt,
                           @Param("endedAt") OffsetDateTime endedAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE auction_item a SET a.status = :newStatus " +
            "WHERE a.auctionItemId = :id AND a.status = 'live' AND a.endedAt <= :now")
    int resolveExpiredIfLive(@Param("id") Long id,
                             @Param("newStatus") String newStatus,
                             @Param("now") OffsetDateTime now);
}
