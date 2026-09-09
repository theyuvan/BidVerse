package com.example.bidverse.Service;

import com.example.bidverse.Entity.Deal;
import com.example.bidverse.Entity.Product;
import com.example.bidverse.Repository.CategoryRepository;
import com.example.bidverse.Repository.DealRepository;
import com.example.bidverse.Repository.ProductRepository;
import com.example.bidverse.Repository.SellerDealViewRow;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.math.BigDecimal;

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

        sellerService.confirmDeal(41L, 31L, "confirm", null);

        assertEquals("confirmed", deal.getSellerStatus());
        assertEquals("completed", deal.getStatus());
        verify(dealRepository).saveAndFlush(deal);
    }

    @Test
    void oneSellerConfirmationLeavesDealPendingForBuyer() {
        Deal deal = pendingDeal();
        when(dealRepository.findByIdForDecision(31L)).thenReturn(Optional.of(deal));
        when(dealRepository.findDealViewById(31L)).thenReturn(Optional.of(dealViewRow));

        sellerService.confirmDeal(41L, 31L, "confirm", null);

        assertEquals("confirmed", deal.getSellerStatus());
        assertEquals("pending", deal.getStatus());
    }

    @Test
    void sellerRejectionRequiresReason() {
        Deal deal = pendingDeal();
        when(dealRepository.findByIdForDecision(31L)).thenReturn(Optional.of(deal));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> sellerService.confirmDeal(41L, 31L, "reject", "")
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(dealRepository, never()).saveAndFlush(any());
    }

    @Test
    void sellerRejectionCancelsDealWithReason() {
        Deal deal = pendingDeal();
        when(dealRepository.findByIdForDecision(31L)).thenReturn(Optional.of(deal));
        when(dealRepository.findDealViewById(31L)).thenReturn(Optional.of(dealViewRow));

        sellerService.confirmDeal(41L, 31L, "reject", "changed my mind");

        assertEquals("cancelled", deal.getStatus());
        assertEquals("changed my mind", deal.getCancelReason());
    }

    @Test
    void sellerCannotDecideAnotherSellersDeal() {
        Deal deal = pendingDeal();
        when(dealRepository.findByIdForDecision(31L)).thenReturn(Optional.of(deal));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> sellerService.confirmDeal(99L, 31L, "confirm", null)
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(dealRepository, never()).saveAndFlush(any());
    }

    @Test
    void createProductPreservesPublicImageUrl() {
        Product request = new Product();
        request.setCategoryId(7L);
        request.setName("Camera");
        request.setDescription("Mirrorless camera");
        request.setBasePrice(new BigDecimal("45000"));
        request.setImageUrl("https://project.supabase.co/storage/v1/object/public/Products/camera.jpg");

        sellerService.createProduct(41L, request);

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(productCaptor.capture());
        Product savedProduct = productCaptor.getValue();
        assertEquals(41L, savedProduct.getSellerId());
        assertEquals("pending", savedProduct.getStatus());
        assertEquals(request.getImageUrl(), savedProduct.getImageUrl());
    }

    private Deal pendingDeal() {
        Deal deal = new Deal();
        deal.setDealId(31L);
        deal.setAuctionItemId(11L);
        deal.setBuyerId(21L);
        deal.setSellerId(41L);
        deal.setStatus("pending");
        deal.setBuyerStatus("pending");
        deal.setSellerStatus("pending");
        return deal;
    }
}
