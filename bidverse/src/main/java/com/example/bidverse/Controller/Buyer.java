package com.example.bidverse.Controller;

import com.example.bidverse.Dto.BookingSummary;
import com.example.bidverse.Dto.BuyerWonDeal;
import com.example.bidverse.Dto.CatalogItem;
import com.example.bidverse.Dto.DealDecisionRequest;
import com.example.bidverse.Dto.LiveAuctionItem;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Security.AuthenticatedUser;
import com.example.bidverse.Security.CurrentUser;
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
    public ResponseEntity<?> bookRoom(@PathVariable Long roomId, @CurrentUser AuthenticatedUser buyer) {
        return ResponseEntity.ok(buyerService.bookRoom(roomId, buyer.userId()));
    }

    @GetMapping("/rooms/{roomId}/join")
    public ResponseEntity<List<LiveAuctionItem>> joinRoom(
            @PathVariable Long roomId,
            @CurrentUser AuthenticatedUser buyer
    ) {
        return ResponseEntity.ok(buyerService.joinRoom(roomId, buyer.userId()));
    }

    @PostMapping("/rooms/{roomId}/enter")
    public ResponseEntity<List<LiveAuctionItem>> enterRoom(
            @PathVariable Long roomId,
            @CurrentUser AuthenticatedUser buyer
    ) {
        return ResponseEntity.ok(buyerService.joinRoom(roomId, buyer.userId()));
    }

    @GetMapping("/rooms/available")
    public ResponseEntity<List<Room>> getAvailableRooms(@CurrentUser AuthenticatedUser buyer) {
        return ResponseEntity.ok(buyerService.getAvailableRooms(buyer.userId()));
    }

    @GetMapping("/rooms/search")
    public ResponseEntity<List<Room>> searchRooms(@RequestParam String query, @CurrentUser AuthenticatedUser buyer) {
        return ResponseEntity.ok(buyerService.searchRooms(buyer.userId(), query));
    }

    @GetMapping("/deals/{dealId}")
    public ResponseEntity<BuyerWonDeal> getDealById(@PathVariable Long dealId, @CurrentUser AuthenticatedUser buyer) {
        return ResponseEntity.ok(buyerService.getOwnDealDetails(dealId, buyer.userId()));
    }

    @GetMapping("/deals/mine")
    public ResponseEntity<List<BuyerWonDeal>> displayDeals(@CurrentUser AuthenticatedUser buyer) {
        return ResponseEntity.ok(buyerService.getDeals(buyer.userId()));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingSummary>> displayBookings(
            @CurrentUser AuthenticatedUser buyer,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(buyerService.displayBookings(buyer.userId(), status));
    }

    @PostMapping("/deals/{dealId}/decision")
    public ResponseEntity<BuyerWonDeal> decideDeal(
            @PathVariable Long dealId,
            @CurrentUser AuthenticatedUser buyer,
            @RequestBody DealDecisionRequest decision
    ) {
        return ResponseEntity.ok(buyerService.decideDeal(
                buyer.userId(), dealId, decision.decision(), decision.reason()));
    }
}
