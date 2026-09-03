package com.example.bidverse.Repository;

import com.example.bidverse.Entity.auction_item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuctionItemRepository extends JpaRepository<auction_item, Long> {
    boolean existsByProductId(Long productId);

    List<auction_item> findByRoomId(Long roomId);
}
