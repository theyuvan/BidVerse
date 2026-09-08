package com.example.bidverse.Repository;
import com.example.bidverse.Entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DealRepository extends JpaRepository<Deal, Long> {

    List<Deal> findBySellerId(Long sellerId);

    List<Deal> findByBuyerId(Long buyerId);

    boolean existsByAuctionItemId(Long auctionItemId);
}