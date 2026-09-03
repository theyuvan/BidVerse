package com.example.bidverse.Repository;
import com.example.bidverse.Entity.Product;
import org.springframework.data.repository.Repository;
public interface ListProductRepository extends Repository<Product, Long> {

    Product findByProductId(Long productId);

    void save(Product product);
}