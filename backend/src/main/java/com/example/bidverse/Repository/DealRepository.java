package com.example.bidverse.Repository;
import com.example.bidverse.Entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;

public interface DealRepository extends JpaRepository<Deal, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Deal d where d.dealId = :dealId")
    java.util.Optional<Deal> findByIdForDecision(@Param("dealId") Long dealId);

    List<Deal> findBySellerId(Long sellerId);

    List<Deal> findByBuyerId(Long buyerId);

    @Query(value = """
            select
                d.deal_id          as "dealId",
                d.auction_item_id  as "auctionItemId",
                ai.room_id         as "roomId",
                p.product_id       as "productId",
                p.name             as "productName",
                p.description      as "productDescription",
                p.image_url        as "imageUrl",
                d.final_amount     as "finalPrice",
                d.status           as "dealStatus",
                d.cancel_reason    as "cancelReason",
                d.buyer_status     as "buyerStatus",
                d.seller_status    as "sellerStatus",
                seller.user_id     as "sellerId",
                seller.name        as "sellerName",
                seller.email       as "sellerEmail",
                seller.phone       as "sellerPhone"
            from deals d
            join auction_items ai on ai.auction_item_id = d.auction_item_id
            join products p on p.product_id = ai.product_id
            join users seller on seller.user_id = d.seller_id
            where d.buyer_id = :buyerId
            order by d.deal_id desc
            """, nativeQuery = true)
    List<BuyerWonDealRow> findWonDealsByBuyerId(@Param("buyerId") Long buyerId);

    @Query(value = """
            select
                d.deal_id          as "dealId",
                d.auction_item_id  as "auctionItemId",
                ai.room_id         as "roomId",
                p.product_id       as "productId",
                p.name             as "productName",
                p.description      as "productDescription",
                p.image_url        as "imageUrl",
                d.final_amount     as "finalPrice",
                d.status           as "dealStatus",
                d.cancel_reason    as "cancelReason",
                d.buyer_status     as "buyerStatus",
                d.seller_status    as "sellerStatus",
                seller.user_id     as "sellerId",
                seller.name        as "sellerName",
                seller.email       as "sellerEmail",
                seller.phone       as "sellerPhone"
            from deals d
            join auction_items ai on ai.auction_item_id = d.auction_item_id
            join products p on p.product_id = ai.product_id
            join users seller on seller.user_id = d.seller_id
            where d.deal_id = :dealId
            """, nativeQuery = true)
    java.util.Optional<BuyerWonDealRow> findWonDealById(@Param("dealId") Long dealId);

    @Query(value = """
            select
                d.deal_id          as "dealId",
                d.auction_item_id  as "auctionItemId",
                ai.room_id         as "roomId",
                p.product_id       as "productId",
                p.name             as "productName",
                p.description      as "productDescription",
                p.image_url        as "imageUrl",
                d.final_amount     as "finalPrice",
                d.status           as "status",
                d.cancel_reason    as "cancelReason",
                d.buyer_status     as "buyerStatus",
                d.seller_status    as "sellerStatus",
                d.seller_id        as "sellerId",
                buyer.user_id      as "buyerId",
                buyer.name         as "buyerName",
                buyer.email        as "buyerEmail",
                buyer.phone        as "buyerPhone"
            from deals d
            join auction_items ai on ai.auction_item_id = d.auction_item_id
            join products p on p.product_id = ai.product_id
            join users buyer on buyer.user_id = d.buyer_id
            where d.seller_id = :sellerId
            order by d.deal_id desc
            """, nativeQuery = true)
    List<SellerDealViewRow> findDealViewsBySellerId(@Param("sellerId") Long sellerId);

    @Query(value = """
            select
                d.deal_id          as "dealId",
                d.auction_item_id  as "auctionItemId",
                ai.room_id         as "roomId",
                p.product_id       as "productId",
                p.name             as "productName",
                p.description      as "productDescription",
                p.image_url        as "imageUrl",
                d.final_amount     as "finalPrice",
                d.status           as "status",
                d.cancel_reason    as "cancelReason",
                d.buyer_status     as "buyerStatus",
                d.seller_status    as "sellerStatus",
                d.seller_id        as "sellerId",
                buyer.user_id      as "buyerId",
                buyer.name         as "buyerName",
                buyer.email        as "buyerEmail",
                buyer.phone        as "buyerPhone"
            from deals d
            join auction_items ai on ai.auction_item_id = d.auction_item_id
            join products p on p.product_id = ai.product_id
            join users buyer on buyer.user_id = d.buyer_id
            where d.deal_id = :dealId
            """, nativeQuery = true)
    java.util.Optional<SellerDealViewRow> findDealViewById(@Param("dealId") Long dealId);

    boolean existsByAuctionItemId(Long auctionItemId);
}
