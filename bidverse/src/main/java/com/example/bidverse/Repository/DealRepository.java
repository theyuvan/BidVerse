package com.example.bidverse.Repository;

import com.example.bidverse.Entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DealRepository extends JpaRepository<Deal, Long> {
    Optional<Deal> findByAuctionItemId(Long auctionItemId);
}
