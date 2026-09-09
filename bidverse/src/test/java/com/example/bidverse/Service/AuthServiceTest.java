package com.example.bidverse.Service;

import com.example.bidverse.Dto.AuthResponse;
import com.example.bidverse.Dto.LoginRequest;
import com.example.bidverse.Entity.User;
import com.example.bidverse.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder);
    }

    @Test
    void legacyPlainTextPasswordIsMigratedAfterValidHostLogin() {
        User host = hostWithPassword("vicky");
        LoginRequest request = loginRequest("vicky", "host");
        String bcryptHash = "$2a$10$01234567890123456789012345678901234567890123456789012";

        when(userRepository.findByEmail("vicky@gmail.com")).thenReturn(Optional.of(host));
        when(passwordEncoder.encode("vicky")).thenReturn(bcryptHash);

        AuthResponse response = authService.login(request);

        assertEquals("host", response.role());
        assertEquals(bcryptHash, host.getPassword());
        verify(userRepository).save(host);
    }

    @Test
    void bcryptPasswordUsesEncoderWithoutSavingAgain() {
        String bcryptHash = "$2a$10$01234567890123456789012345678901234567890123456789012";
        User host = hostWithPassword(bcryptHash);
        LoginRequest request = loginRequest("vicky", "host");

        when(userRepository.findByEmail("vicky@gmail.com")).thenReturn(Optional.of(host));
        when(passwordEncoder.matches("vicky", bcryptHash)).thenReturn(true);

        authService.login(request);

        verify(passwordEncoder).matches("vicky", bcryptHash);
        verify(userRepository, never()).save(host);
    }

    @Test
    void invalidLegacyPasswordRemainsUnauthorizedAndIsNotMigrated() {
        User host = hostWithPassword("vicky");
        LoginRequest request = loginRequest("wrong", "host");
        when(userRepository.findByEmail("vicky@gmail.com")).thenReturn(Optional.of(host));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> authService.login(request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatusCode());
        assertEquals("vicky", host.getPassword());
        verify(userRepository, never()).save(host);
    }

    @Test
    void validPasswordWithWrongRoleDoesNotMigrateAccount() {
        User host = hostWithPassword("vicky");
        LoginRequest request = loginRequest("vicky", "buyer");
        when(userRepository.findByEmail("vicky@gmail.com")).thenReturn(Optional.of(host));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> authService.login(request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatusCode());
        assertEquals("vicky", host.getPassword());
        verify(userRepository, never()).save(host);
    }

    private User hostWithPassword(String password) {
        return new User(
                1L,
                "Vicky",
                "vicky@gmail.com",
                "9876501001",
                password,
                "host"
        );
    }

    private LoginRequest loginRequest(String password, String role) {
        LoginRequest request = new LoginRequest();
        request.setEmail("vicky@gmail.com");
        request.setPassword(password);
        request.setRole(role);
        return request;
    }
}
