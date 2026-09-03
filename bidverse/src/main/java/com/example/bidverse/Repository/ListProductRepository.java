package com.example.bidverse.Repository;
import com.example.bidverse.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ListProductRepository extends JpaRepository<Product, Long> {
}