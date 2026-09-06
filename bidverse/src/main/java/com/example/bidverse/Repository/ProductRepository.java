package com.example.bidverse.Repository;

import com.example.bidverse.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByStatus(String status);
    List<Product> findBySellerId(Long sellerId);

    @Query(value = """
            select
                p.product_id    as "productId",
                p.category_id   as "categoryId",
                c.name          as "categoryName",
                p.name          as "name",
                p.description   as "description",
                p.base_price    as "basePrice",
                p.status        as "productStatus",
                ai.room_id      as "roomId",
                ai.status       as "auctionStatus",
                d.status        as "dealStatus",
                d.buyer_id      as "buyerId",
                buyer.name      as "buyerName",
                buyer.email     as "buyerEmail",
                buyer.phone     as "buyerPhone"
            from products p
            left join categories c on c.category_id = p.category_id
            left join auction_items ai on ai.product_id = p.product_id
            left join deals d on d.auction_item_id = ai.auction_item_id
            left join users buyer on buyer.user_id = d.buyer_id
            where p.seller_id = :sellerId
            order by p.product_id
            """, nativeQuery = true)
    List<SellerProductHistoryRow> findHistoryBySellerId(@Param("sellerId") Long sellerId);

    @Query(value = """
            select
                p.product_id   as "productId",
                p.seller_id    as "sellerId",
                seller.name    as "sellerName",
                p.category_id  as "categoryId",
                c.name         as "categoryName",
                p.name         as "productName",
                p.description  as "description",
                p.base_price   as "basePrice",
                p.status       as "status"
            from products p
            join categories c on c.category_id = p.category_id
            join users seller on seller.user_id = p.seller_id
            order by p.product_id
            """, nativeQuery = true)
    List<ProductDisplayRow> findAllDisplayProducts();

    @Query(value = """
            select
                p.product_id   as "productId",
                p.seller_id    as "sellerId",
                seller.name    as "sellerName",
                p.category_id  as "categoryId",
                c.name         as "categoryName",
                p.name         as "productName",
                p.description  as "description",
                p.base_price   as "basePrice",
                p.status       as "status"
            from products p
            join categories c on c.category_id = p.category_id
            join users seller on seller.user_id = p.seller_id
            where lower(p.status) = lower(:status)
            order by p.product_id
            """, nativeQuery = true)
    List<ProductDisplayRow> findDisplayProductsByStatus(@Param("status") String status);
}
