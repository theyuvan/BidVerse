package com.example.bidverse.Service;

import com.example.bidverse.Dto.LiveAuctionItem;
import com.example.bidverse.Dto.BuyerWonDeal;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.Room_Seat;
import com.example.bidverse.Repository.AuctionItemRepository;
import com.example.bidverse.Repository.BuyerWonDealRow;
import com.example.bidverse.Repository.CatalogItemRow;
import com.example.bidverse.Repository.DealRepository;
import com.example.bidverse.Repository.LiveAuctionItemRow;
import com.example.bidverse.Repository.RoomRepo;
import com.example.bidverse.Repository.RoomSeatRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuyerServiceTest {

    @Mock
    private RoomRepo roomRepo;
    @Mock
    private AuctionItemRepository auctionItemRepo;
    @Mock
    private RoomSeatRepository roomSeatRepo;
    @Mock
    private DealRepository dealRepo;
    @Mock
    private LiveAuctionItemRow liveItemRow;
    @Mock
    private BuyerWonDealRow wonDealRow;
    @Mock
    private CatalogItemRow catalogItemRow;

    private BuyerService buyerService;

    @BeforeEach
    void setUp() {
        buyerService = new BuyerService(roomRepo, auctionItemRepo, roomSeatRepo, dealRepo);
    }

    @Test
    void buyerCanBookNewRoomDespiteHavingASeatInAnAlreadyCompletedRoom() {
        Room newRoom = room("waiting");
        newRoom.setRoomId(2L);
        newRoom.setStartTime(OffsetDateTime.now());
        Room completedRoom = room("completed");
        completedRoom.setRoomId(1L);

        Room_Seat existingSeat = new Room_Seat();
        existingSeat.setRoomId(1L);
        existingSeat.setBuyerId(21L);

        when(roomRepo.findById(2L)).thenReturn(Optional.of(newRoom));
        when(roomSeatRepo.existsByRoomIdAndBuyerId(2L, 21L)).thenReturn(false);
        when(auctionItemRepo.findCatalogByRoomId(2L)).thenReturn(List.of(catalogItemRow));
        when(roomSeatRepo.findByBuyerId(21L)).thenReturn(List.of(existingSeat));
        when(roomRepo.findAllById(List.of(1L))).thenReturn(List.of(completedRoom));
        when(roomSeatRepo.countByRoomId(2L)).thenReturn(0L);
        when(roomSeatRepo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Room_Seat result = buyerService.bookRoom(2L, 21L);

        assertEquals(2L, result.getRoomId());
        assertEquals(21L, result.getBuyerId());
    }

    @Test
    void bookedBuyerCanEnterLiveRoomAndReceiveAuctionItems() {
        Room room = room("live");
        when(roomRepo.findById(1L)).thenReturn(Optional.of(room));
        when(roomSeatRepo.existsByRoomIdAndBuyerId(1L, 21L)).thenReturn(true);
        when(roomSeatRepo.markBuyerJoined(eq(1L), eq(21L), any())).thenReturn(1);
        when(auctionItemRepo.findLiveAuctionItemsByRoomId(1L)).thenReturn(List.of(liveItemRow));
        when(liveItemRow.getAuctionItemId()).thenReturn(11L);
        when(liveItemRow.getProductId()).thenReturn(101L);
        when(liveItemRow.getProductName()).thenReturn("Camera");
        when(liveItemRow.getCategoryName()).thenReturn("Electronics");
        when(liveItemRow.getSellerName()).thenReturn("Seller");
        when(liveItemRow.getBasePrice()).thenReturn(new BigDecimal("100.00"));
        when(liveItemRow.getCurrentPrice()).thenReturn(new BigDecimal("105.00"));
        when(liveItemRow.getAuctionStatus()).thenReturn("live");

        List<LiveAuctionItem> items = buyerService.joinRoom(1L, 21L);

        assertEquals(1, items.size());
        assertEquals(11L, items.getFirst().auctionItemId());
        assertEquals("live", items.getFirst().auctionStatus());
        verify(roomSeatRepo).markBuyerJoined(eq(1L), eq(21L), any());
    }

    @Test
    void unbookedBuyerCannotEnterLiveRoom() {
        when(roomRepo.findById(1L)).thenReturn(Optional.of(room("live")));
        when(roomSeatRepo.existsByRoomIdAndBuyerId(1L, 21L)).thenReturn(false);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> buyerService.joinRoom(1L, 21L)
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(auctionItemRepo, never()).findLiveAuctionItemsByRoomId(1L);
    }

    @Test
    void bookedBuyerCanEnterDuringWaitingPeriod() {
        when(roomRepo.findById(1L)).thenReturn(Optional.of(room("waiting")));
        when(roomSeatRepo.existsByRoomIdAndBuyerId(1L, 21L)).thenReturn(true);
        when(roomSeatRepo.markBuyerJoined(eq(1L), eq(21L), any())).thenReturn(1);
        when(auctionItemRepo.findLiveAuctionItemsByRoomId(1L)).thenReturn(List.of());

        buyerService.joinRoom(1L, 21L);

        verify(roomSeatRepo).markBuyerJoined(eq(1L), eq(21L), any());
    }

    @Test
    void buyerWhoMissedTheWaitingWindowCanStillJoinWhileRoomIsLive() {
        when(roomRepo.findById(1L)).thenReturn(Optional.of(room("live")));
        when(roomSeatRepo.existsByRoomIdAndBuyerId(1L, 21L)).thenReturn(true);
        when(auctionItemRepo.findLiveAuctionItemsByRoomId(1L)).thenReturn(List.of());



        buyerService.joinRoom(1L, 21L);

        verify(roomSeatRepo).markBuyerJoined(eq(1L), eq(21L), any());
    }

    @Test
    void completedRoomStopsJoinRetriesWithGoneResponse() {
        when(roomRepo.findById(1L)).thenReturn(Optional.of(room("completed")));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> buyerService.joinRoom(1L, 21L)
        );

        assertEquals(HttpStatus.GONE, error.getStatusCode());
        verify(roomSeatRepo, never()).markBuyerJoined(any(), any(), any());
    }

    @Test
    void buyerWonDealsIncludeSellerContactAndProductDetails() {
        when(dealRepo.findWonDealsByBuyerId(21L)).thenReturn(List.of(wonDealRow));
        when(wonDealRow.getDealId()).thenReturn(31L);
        when(wonDealRow.getProductName()).thenReturn("Camera");
        when(wonDealRow.getSellerName()).thenReturn("Seller One");
        when(wonDealRow.getSellerPhone()).thenReturn("9876543210");

        List<BuyerWonDeal> deals = buyerService.getDeals(21L);

        assertEquals(1, deals.size());
        assertEquals("Camera", deals.getFirst().productName());
        assertEquals("Seller One", deals.getFirst().sellerName());
        assertEquals("9876543210", deals.getFirst().sellerPhone());
    }

    @Test
    void buyerConfirmationCompletesDealWhenSellerAlreadyConfirmed() {
        com.example.bidverse.Entity.Deal deal = pendingDeal();
        deal.setSellerStatus("confirmed");
        when(dealRepo.findByIdForDecision(31L)).thenReturn(Optional.of(deal));
        when(dealRepo.findWonDealById(31L)).thenReturn(Optional.of(wonDealRow));

        buyerService.decideDeal(21L, 31L, "confirm", null);

        assertEquals("confirmed", deal.getBuyerStatus());
        assertEquals("completed", deal.getStatus());
        verify(dealRepo).saveAndFlush(deal);
    }

    @Test
    void buyerRejectionRequiresReason() {
        com.example.bidverse.Entity.Deal deal = pendingDeal();
        when(dealRepo.findByIdForDecision(31L)).thenReturn(Optional.of(deal));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> buyerService.decideDeal(21L, 31L, "reject", "  ")
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(dealRepo, never()).saveAndFlush(any());
    }

    @Test
    void buyerRejectionCancelsDealWithReason() {
        com.example.bidverse.Entity.Deal deal = pendingDeal();
        when(dealRepo.findByIdForDecision(31L)).thenReturn(Optional.of(deal));
        when(dealRepo.findWonDealById(31L)).thenReturn(Optional.of(wonDealRow));

        buyerService.decideDeal(21L, 31L, "reject", "changed my mind");

        assertEquals("cancelled", deal.getStatus());
        assertEquals("changed my mind", deal.getCancelReason());
    }

    @Test
    void buyerCannotDecideAnotherBuyersDeal() {
        com.example.bidverse.Entity.Deal deal = pendingDeal();
        when(dealRepo.findByIdForDecision(31L)).thenReturn(Optional.of(deal));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> buyerService.decideDeal(99L, 31L, "confirm", null)
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(dealRepo, never()).saveAndFlush(any());
    }

    private com.example.bidverse.Entity.Deal pendingDeal() {
        com.example.bidverse.Entity.Deal deal = new com.example.bidverse.Entity.Deal();
        deal.setDealId(31L);
        deal.setAuctionItemId(11L);
        deal.setBuyerId(21L);
        deal.setSellerId(41L);
        deal.setStatus("pending");
        deal.setBuyerStatus("pending");
        deal.setSellerStatus("pending");
        return deal;
    }

    private Room room(String status) {
        Room room = new Room();
        room.setRoomId(1L);
        room.setHostId(51L);
        room.setTitle("Test auction");
        room.setSeatLimit(10);
        room.setAdvanceAmount(new BigDecimal("20.00"));
        room.setStatus(status);
        room.setStartTime(OffsetDateTime.now());
        return room;
    }
}
