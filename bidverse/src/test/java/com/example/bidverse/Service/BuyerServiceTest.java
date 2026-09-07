package com.example.bidverse.Service;

import com.example.bidverse.Dto.LiveAuctionItem;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Repository.AuctionItemRepository;
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

    private BuyerService buyerService;

    @BeforeEach
    void setUp() {
        buyerService = new BuyerService(roomRepo, auctionItemRepo, roomSeatRepo, dealRepo);
    }

    @Test
    void bookedBuyerCanEnterLiveRoomAndReceiveAuctionItems() {
        Room room = room("live");
        when(roomRepo.findById(1L)).thenReturn(Optional.of(room));
        when(roomSeatRepo.existsByRoomIdAndBuyerId(1L, 21L)).thenReturn(true);
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

    private Room room(String status) {
        return new Room(
                1L,
                51L,
                "Test auction",
                10,
                new BigDecimal("20.00"),
                status,
                OffsetDateTime.now()
        );
    }
}
