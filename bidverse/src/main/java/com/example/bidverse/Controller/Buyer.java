package com.example.bidverse.Controller;

import com.example.bidverse.Dto.BookSeatRequest;
import com.example.bidverse.Dto.BookingSummary;
import com.example.bidverse.Dto.BuyerWonDeal;
import com.example.bidverse.Dto.CatalogItem;
import com.example.bidverse.Dto.LiveAuctionItem;
import com.example.bidverse.Dto.RejectRequest;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Service.BuyerService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/buyer")
public class Buyer {

    private final BuyerService buyerService;

    public Buyer(BuyerService buyerService) {
        this.buyerService = buyerService;
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<List<CatalogItem>> getRoomCatalog(@PathVariable Long roomId) {
        return ResponseEntity.ok(buyerService.getRoomCatalog(roomId));
    }

    @GetMapping("/rooms/{roomId}/details")
    public ResponseEntity<Room> getRoomDetails(@PathVariable Long roomId) {
        return ResponseEntity.ok(buyerService.getRoomDetails(roomId));
    }

    @PostMapping("/rooms/{roomId}/book")
    public ResponseEntity<?> bookRoom(@PathVariable Long roomId, @RequestBody BookSeatRequest request) {
        return ResponseEntity.ok(buyerService.bookRoom(roomId, request.buyerId()));
    }

    @GetMapping("/rooms/{roomId}/join")
    public ResponseEntity<List<LiveAuctionItem>> joinRoom(
            @PathVariable Long roomId,
            @RequestParam Long buyerId
    ) {
        return ResponseEntity.ok(buyerService.joinRoom(roomId, buyerId));
    }

    @PostMapping("/rooms/{roomId}/enter")
    public ResponseEntity<List<LiveAuctionItem>> enterRoom(
            @PathVariable Long roomId,
            @RequestParam Long buyerId
    ) {
        return ResponseEntity.ok(buyerService.joinRoom(roomId, buyerId));
    }

    @GetMapping("/rooms/available")
    public ResponseEntity<List<Room>> getAvailableRooms() {
        return ResponseEntity.ok(buyerService.getAvailableRooms());
    }

    @GetMapping("/rooms/search")
    public ResponseEntity<List<Room>> searchRooms(@RequestParam String query) {
        return ResponseEntity.ok(buyerService.searchRooms(query));
    }

    @GetMapping("/deals")
    public ResponseEntity<?> getAllDeals() {
        return ResponseEntity.ok(buyerService.getAllDeals());
    }

    @GetMapping("/deals/{dealId}")
    public ResponseEntity<?> getDealById(@PathVariable Long dealId) {
        return ResponseEntity.ok(buyerService.getDealId(dealId));
    }

    // GET /buyer/{buyerId}/deals -> everything this buyer has won (mirrors /seller/{sellerId}/deals)
    @GetMapping("/{buyerId}/deals")
    public ResponseEntity<List<BuyerWonDeal>> displayDeals(@PathVariable Long buyerId) {
        return ResponseEntity.ok(buyerService.getDeals(buyerId));
    }

    @GetMapping("/{buyerId}/bookings")
    public ResponseEntity<List<BookingSummary>> displayBookings(
            @PathVariable Long buyerId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(buyerService.displayBookings(buyerId, status));
    }

    @PostMapping("/deals/{dealId}/Confirm")
    public ResponseEntity<?> confirmDeal(@PathVariable Long dealId) {
        return ResponseEntity.ok(buyerService.confirmDeal(dealId));
    }

    @PostMapping("/deals/{dealId}/Reject")
    public ResponseEntity<?> rejectDeal(@PathVariable Long dealId, @RequestBody RejectRequest reason) {
        return ResponseEntity.ok(buyerService.rejectDeal(dealId, reason.getReason()));
    }
}
