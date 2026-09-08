package com.example.bidverse.Service;

import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Repository.CategoryRepository;
import com.example.bidverse.Repository.DealRepository;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.SellerDealViewRow;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SellerServiceTest {

    @Mock
    private DealRepository dealRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private SellerDealViewRow dealViewRow;

    private SellerService sellerService;

    @BeforeEach
    void setUp() {
        sellerService = new SellerService(dealRepository, productRepository, categoryRepository);
    }

    @Test
    void sellerConfirmationCompletesDealWhenBuyerAlreadyConfirmed() {
        Deal deal = pendingDeal();
        deal.setBuyerStatus("confirmed");
        when(dealRepository.findByIdForDecision(31L)).thenReturn(Optional.of(deal));
        when(dealRepository.findDealViewById(31L)).thenReturn(Optional.of(dealViewRow));

        sellerService.confirmDeal(31L, "confirm", null);

        assertEquals("confirmed", deal.getSellerStatus());
        assertEquals("completed", deal.getStatus());
        verify(dealRepository).saveAndFlush(deal);
    }

    @Test
    void oneSellerConfirmationLeavesDealPendingForBuyer() {
        Deal deal = pendingDeal();
        when(dealRepository.findByIdForDecision(31L)).thenReturn(Optional.of(deal));
        when(dealRepository.findDealViewById(31L)).thenReturn(Optional.of(dealViewRow));

        sellerService.confirmDeal(31L, "confirm", null);

        assertEquals("confirmed", deal.getSellerStatus());
        assertEquals("pending", deal.getStatus());
    }

    @Test
    void sellerRejectionRequiresReason() {
        Deal deal = pendingDeal();
        when(dealRepository.findByIdForDecision(31L)).thenReturn(Optional.of(deal));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> sellerService.confirmDeal(31L, "reject", "")
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(dealRepository, never()).saveAndFlush(any());
    }

    private Deal pendingDeal() {
        Deal deal = new Deal();
        deal.setDealId(31L);
        deal.setStatus("pending");
        deal.setBuyerStatus("pending");
        deal.setSellerStatus("pending");
        return deal;
    }
}
