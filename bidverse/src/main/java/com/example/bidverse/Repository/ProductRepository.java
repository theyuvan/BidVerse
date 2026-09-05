package com.example.bidverse.Repository;

import com.example.bidverse.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByStatus(String status);

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
