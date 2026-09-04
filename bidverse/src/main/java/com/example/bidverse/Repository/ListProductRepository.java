package com.example.bidverse.Repository;
import com.example.bidverse.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ListProductRepository extends JpaRepository<Product, Long> {
	List<Product> findBySellerId(Long sellerId);
}