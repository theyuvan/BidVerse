package com.example.bidverse.Repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.bidverse.Entity.Deal;

public interface DealRepository extends JpaRepository<Deal, Long>{

    List<Deal> findBySellerId(Long sellerId);
}
