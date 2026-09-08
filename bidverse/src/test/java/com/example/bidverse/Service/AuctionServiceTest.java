package com.example.bidverse.Service;

import com.example.bidverse.Dto.BidError;
import com.example.bidverse.Dto.BidMessage;
import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Entity.Room;
import com.example.bidverse.Entity.auction_item;
import com.example.bidverse.Entity.bid;
import com.example.bidverse.Repository.AuctionItemRepository;
import com.example.bidverse.Repository.BidRepository;
import com.example.bidverse.Repository.DealRepository;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.RoomRepo;
import com.example.bidverse.Repository.RoomSeatRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuctionServiceTest {

    @Mock
    private AuctionItemRepository auctionItemRepo;
    @Mock
    private RoomRepo roomRepo;
    @Mock
    private RoomSeatRepository roomSeatRepo;
    @Mock
    private ProductRepository productRepo;
    @Mock
    private BidRepository bidRepository;
    @Mock
    private DealRepository dealRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private ObjectProvider<AuctionService> self;

    private AuctionService auctionService;

    @BeforeEach
    void setUp() {
        auctionService = new AuctionService(
                auctionItemRepo,
                roomRepo,
                roomSeatRepo,
                productRepo,
                bidRepository,
                dealRepository,
                messagingTemplate,
                self
        );
    }

    @Test
    void newlyActivatedItemGetsTenSecondDeadline() {
        auction_item item = liveItem(new BigDecimal("100.00"), null);
        item.setStatus("waiting");
        when(auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(1L)).thenReturn(List.of(item));
        when(auctionItemRepo.activateIfWaiting(eq(11L), any(), any())).thenReturn(1);
        when(auctionItemRepo.findById(11L)).thenReturn(Optional.of(item));

        com.example.bidverse.Entity.Room room = new com.example.bidverse.Entity.Room();
        room.setRoomId(1L);
        auctionService.activateFirstItem(room);

        ArgumentCaptor<OffsetDateTime> startedAt = ArgumentCaptor.forClass(OffsetDateTime.class);
        ArgumentCaptor<OffsetDateTime> endedAt = ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(auctionItemRepo).activateIfWaiting(eq(11L), startedAt.capture(), endedAt.capture());
        assertEquals(10, Duration.between(startedAt.getValue(), endedAt.getValue()).getSeconds());
    }

    @Test
    void hostStartOpensWaitingRoomWithoutStartingFirstProduct() {
        Room room = room("waiting");
        auction_item item = liveItem(new BigDecimal("100.00"), null);
        item.setStatus("waiting");
        when(roomRepo.findById(1L)).thenReturn(Optional.of(room));
        when(auctionItemRepo.findByRoomId(1L)).thenReturn(List.of(item));
        when(roomRepo.beginWaitingIfNotStarted(eq(1L), any())).thenReturn(1);

        Room startedRoom = auctionService.startRoom(1L);

        assertEquals("waiting", startedRoom.getStatus());
        verify(roomRepo).beginWaitingIfNotStarted(eq(1L), any());
        verify(auctionItemRepo, never()).activateIfWaiting(any(), any(), any());
    }

    @Test
    void roomCannotStartWithoutAnApprovedProduct() {
        when(roomRepo.findById(1L)).thenReturn(Optional.of(room("upcoming")));
        when(auctionItemRepo.findByRoomId(1L)).thenReturn(List.of());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> auctionService.startRoom(1L)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(roomRepo, never()).beginWaitingIfNotStarted(any(), any());
    }

    @Test
    void waitingRoomForfeitsAbsentSeatsBeforeBiddingStarts() {
        Room room = room("live");
        auction_item item = liveItem(new BigDecimal("100.00"), null);
        item.setStatus("waiting");
        when(roomRepo.goLiveIfWaiting(eq(1L), any(), any())).thenReturn(1);
        when(roomRepo.findById(1L)).thenReturn(Optional.of(room));
        when(auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(1L)).thenReturn(List.of(item));
        when(auctionItemRepo.activateIfWaiting(eq(11L), any(), any())).thenReturn(1);
        when(auctionItemRepo.findById(11L)).thenReturn(Optional.of(item));

        auctionService.openBidding(1L);

        verify(roomSeatRepo).markAbsentBuyers(1L);
        verify(auctionItemRepo).activateIfWaiting(eq(11L), any(), any());
    }

    @Test
    void joinedBuyerBidIsAcceptedAndResetsDeadlineToTenSeconds() {
        auction_item item = liveItem(new BigDecimal("100.00"), OffsetDateTime.now().plusSeconds(5));
        when(auctionItemRepo.findById(11L)).thenReturn(Optional.of(item));
        when(roomSeatRepo.existsByRoomIdAndBuyerIdAndAttendanceStatus(1L, 21L, "joined")).thenReturn(true);
        when(auctionItemRepo.acceptBidAndResetDeadline(
                eq(11L), eq(new BigDecimal("100.00")), eq(new BigDecimal("105.00")), any(), any()))
                .thenReturn(1);

        auctionService.placeBid(1L, new BidMessage(11L, 21L, "AUTO", null));

        ArgumentCaptor<OffsetDateTime> bidTime = ArgumentCaptor.forClass(OffsetDateTime.class);
        ArgumentCaptor<OffsetDateTime> deadline = ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(auctionItemRepo).acceptBidAndResetDeadline(
                eq(11L), eq(new BigDecimal("100.00")), eq(new BigDecimal("105.00")),
                bidTime.capture(), deadline.capture());
        assertEquals(10, Duration.between(bidTime.getValue(), deadline.getValue()).getSeconds());
        verify(bidRepository).upsertBid(11L, 21L, new BigDecimal("105.00"), bidTime.getValue());
    }

    @Test
    void buyerWithoutRoomSeatCannotBid() {
        auction_item item = liveItem(new BigDecimal("100.00"), OffsetDateTime.now().plusSeconds(10));
        when(auctionItemRepo.findById(11L)).thenReturn(Optional.of(item));
        when(roomSeatRepo.existsByRoomIdAndBuyerIdAndAttendanceStatus(1L, 21L, "joined")).thenReturn(false);

        auctionService.placeBid(1L, new BidMessage(11L, 21L, "AUTO", null));

        verify(auctionItemRepo, never()).acceptBidAndResetDeadline(any(), any(), any(), any(), any());
        verify(bidRepository, never()).upsertBid(any(), any(), any(), any());
        verify(messagingTemplate).convertAndSend(
                eq("/topic/room/1/buyer/21"),
                eq(new BidError(11L, "You must enter this room during the waiting period before bidding")));
    }

    @Test
    void firstConcurrentBidWinsTheAtomicPriceUpdate() throws Exception {
        auction_item item = liveItem(new BigDecimal("100.00"), OffsetDateTime.now().plusSeconds(10));
        when(auctionItemRepo.findById(11L)).thenReturn(Optional.of(item));
        when(roomSeatRepo.existsByRoomIdAndBuyerIdAndAttendanceStatus(eq(1L), any(), eq("joined"))).thenReturn(true);

        AtomicBoolean claimed = new AtomicBoolean();
        CountDownLatch firstBidReachedDatabase = new CountDownLatch(1);
        CountDownLatch releaseFirstBid = new CountDownLatch(1);
        when(auctionItemRepo.acceptBidAndResetDeadline(any(), any(), any(), any(), any()))
                .thenAnswer(invocation -> {
                    if (claimed.compareAndSet(false, true)) {
                        firstBidReachedDatabase.countDown();
                        assertTrue(releaseFirstBid.await(2, TimeUnit.SECONDS));
                        return 1;
                    }
                    return 0;
                });

        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> first = executor.submit(() -> auctionService.placeBid(
                    1L, new BidMessage(11L, 21L, "MANUAL", new BigDecimal("110.00"))));
            assertTrue(firstBidReachedDatabase.await(2, TimeUnit.SECONDS));

            Future<?> second = executor.submit(() -> auctionService.placeBid(
                    1L, new BidMessage(11L, 22L, "MANUAL", new BigDecimal("110.00"))));
            second.get(2, TimeUnit.SECONDS);
            releaseFirstBid.countDown();
            first.get(2, TimeUnit.SECONDS);
        } finally {
            releaseFirstBid.countDown();
            executor.shutdownNow();
        }

        verify(bidRepository).upsertBid(eq(11L), eq(21L), eq(new BigDecimal("110.00")), any());
        verify(bidRepository, never()).upsertBid(eq(11L), eq(22L), any(), any());
    }

    @Test
    void expiredItemWithoutBidsBecomesUnsold() {
        auction_item item = liveItem(new BigDecimal("100.00"), OffsetDateTime.now().minusSeconds(1));
        when(bidRepository.existsByAuctionItemId(11L)).thenReturn(false);
        when(auctionItemRepo.resolveExpiredIfLive(eq(11L), eq("unsold"), any())).thenReturn(1);
        when(auctionItemRepo.findById(11L)).thenReturn(Optional.of(item));
        when(auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(1L)).thenReturn(List.of(item));

        auctionService.resolveAndAdvance(item);

        verify(auctionItemRepo).resolveExpiredIfLive(eq(11L), eq("unsold"), any());
        verify(dealRepository, never()).save(any());
    }

    @Test
    void expiredItemWithoutBidsActivatesNextProduct() {
        auction_item expired = liveItem(new BigDecimal("100.00"), OffsetDateTime.now().minusSeconds(1));
        auction_item resolved = liveItem(new BigDecimal("100.00"), OffsetDateTime.now().minusSeconds(1));
        resolved.setStatus("unsold");
        auction_item next = new auction_item(
                12L, 1L, 102L, new BigDecimal("200.00"), new BigDecimal("200.00"),
                "waiting", null, null
        );

        when(bidRepository.existsByAuctionItemId(11L)).thenReturn(false);
        when(auctionItemRepo.resolveExpiredIfLive(eq(11L), eq("unsold"), any())).thenReturn(1);
        when(auctionItemRepo.findById(11L)).thenReturn(Optional.of(expired));
        when(auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(1L)).thenReturn(List.of(resolved, next));
        when(auctionItemRepo.activateIfWaiting(eq(12L), any(), any())).thenReturn(1);
        when(auctionItemRepo.findById(12L)).thenReturn(Optional.of(next));

        auctionService.resolveAndAdvance(expired);

        verify(auctionItemRepo).resolveExpiredIfLive(eq(11L), eq("unsold"), any());
        verify(auctionItemRepo).activateIfWaiting(eq(12L), any(), any());
        verify(roomRepo, never()).completeIfLive(1L);
    }

    @Test
    void lastExpiredProductCompletesRoom() {
        auction_item expired = liveItem(new BigDecimal("100.00"), OffsetDateTime.now().minusSeconds(1));
        auction_item resolved = liveItem(new BigDecimal("100.00"), OffsetDateTime.now().minusSeconds(1));
        resolved.setStatus("unsold");
        Room completedRoom = room("completed");

        when(bidRepository.existsByAuctionItemId(11L)).thenReturn(false);
        when(auctionItemRepo.resolveExpiredIfLive(eq(11L), eq("unsold"), any())).thenReturn(1);
        when(auctionItemRepo.findById(11L)).thenReturn(Optional.of(expired));
        when(auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(1L)).thenReturn(List.of(resolved));
        when(roomRepo.completeIfLive(1L)).thenReturn(1);
        when(roomRepo.findById(1L)).thenReturn(Optional.of(completedRoom));

        auctionService.resolveAndAdvance(expired);

        verify(roomRepo).completeIfLive(1L);
        ArgumentCaptor<com.example.bidverse.Dto.AuctionUpdate> updates =
                ArgumentCaptor.forClass(com.example.bidverse.Dto.AuctionUpdate.class);
        verify(messagingTemplate, times(2)).convertAndSend(eq("/topic/room/1"), updates.capture());
        assertEquals("ROOM_COMPLETED", updates.getAllValues().getLast().eventType());
    }

    @Test
    void expiredItemWithBidIsSoldToHighestBuyer() {
        auction_item item = liveItem(new BigDecimal("125.00"), OffsetDateTime.now().minusSeconds(1));
        bid winningBid = new bid(31L, 11L, 21L, new BigDecimal("125.00"), OffsetDateTime.now());
        Product product = new Product();
        product.setProductId(101L);
        product.setSellerId(41L);

        when(bidRepository.existsByAuctionItemId(11L)).thenReturn(true);
        when(auctionItemRepo.resolveExpiredIfLive(eq(11L), eq("sold"), any())).thenReturn(1);
        when(bidRepository.findTopByAuctionItemIdOrderByAmountDesc(11L)).thenReturn(Optional.of(winningBid));
        when(productRepo.findById(101L)).thenReturn(Optional.of(product));
        when(auctionItemRepo.findById(11L)).thenReturn(Optional.of(item));
        when(auctionItemRepo.findByRoomIdOrderByAuctionItemIdAsc(1L)).thenReturn(List.of(item));

        auctionService.resolveAndAdvance(item);

        ArgumentCaptor<Deal> deal = ArgumentCaptor.forClass(Deal.class);
        verify(dealRepository).save(deal.capture());
        assertEquals(21L, deal.getValue().getBuyerId());
        assertEquals(new BigDecimal("125.00"), deal.getValue().getFinalPrice());
        assertEquals("pending", deal.getValue().getStatus());
        assertEquals("pending", deal.getValue().getBuyerStatus());
        assertEquals("pending", deal.getValue().getSellerStatus());
    }

    private auction_item liveItem(BigDecimal currentPrice, OffsetDateTime deadline) {
        return new auction_item(
                11L,
                1L,
                101L,
                new BigDecimal("100.00"),
                currentPrice,
                "live",
                OffsetDateTime.now().minusSeconds(1),
                deadline
        );
    }

    private Room room(String status) {
        Room room = new Room();
        room.setRoomId(1L);
        room.setTitle("Test auction");
        room.setStatus(status);
        room.setStartTime(OffsetDateTime.now().plusMinutes(5));
        return room;
    }
}
