package com.example.bidverse.Controller;

import com.example.bidverse.Dto.AuthResponse;
import com.example.bidverse.Dto.LoginRequest;
import com.example.bidverse.Dto.RegisterRequest;
import com.example.bidverse.Service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return new ResponseEntity<>(authService.register(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public String logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        authService.logout(authorization);
        return "Logout successful";
    }
}
