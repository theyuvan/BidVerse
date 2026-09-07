package com.example.bidverse.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.bidverse.Entity.auction_item;

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
                ai.status          as "auctionStatus"
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
                p.base_price       as "basePrice",
                c.name             as "categoryName"
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
                ai.status          as "auctionStatus"
            from auction_items ai
            join products p on p.product_id = ai.product_id
            join categories c on c.category_id = p.category_id
            join users seller on seller.user_id = p.seller_id
            where ai.room_id = :roomId
            order by ai.auction_item_id
            """, nativeQuery = true)
    List<LiveAuctionItemRow> findLiveAuctionItemsByRoomId(@Param("roomId") Long roomId);
}
