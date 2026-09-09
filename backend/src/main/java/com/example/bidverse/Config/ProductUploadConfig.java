package com.example.bidverse.Config;

import com.example.bidverse.Service.ProductImageStorage;
import jakarta.servlet.MultipartConfigElement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProductUploadConfig {
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        return new MultipartConfigElement("", ProductImageStorage.MAX_BYTES, 3 * 1024 * 1024, 0);
    }
}
