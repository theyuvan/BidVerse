package com.example.bidverse.Controller;

import com.example.bidverse.Security.AuthenticatedUser;
import com.example.bidverse.Security.CurrentUser;
import com.example.bidverse.Service.ProductImageStorage;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/seller/product-images")
public class ProductImages {
    private final ProductImageStorage storage;
    public ProductImages(ProductImageStorage storage) { this.storage = storage; }
    public record ImageUploaded(String imageUrl) {}

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageUploaded upload(@CurrentUser AuthenticatedUser seller, @RequestParam("file") MultipartFile file) {
        return new ImageUploaded(storage.upload(seller, file));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ProblemDetail> uploadError(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(
                ProblemDetail.forStatusAndDetail(error.getStatusCode(), error.getReason()));
    }
}
