package com.example.bidverse.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.bidverse.Dto.AuthResponse;
import com.example.bidverse.Dto.LoginRequest;
import com.example.bidverse.Dto.RegisterRequest;
import com.example.bidverse.Entity.User;
import com.example.bidverse.Repository.UserRepository;
import com.example.bidverse.Security.SessionTokens;
import com.example.bidverse.Security.AuthenticatedUser;

@Service
public class AuthService {
    private static final Set<String> SELF_REGISTERABLE_ROLES = Set.of("buyer", "seller");
    private static final Pattern BCRYPT_HASH = Pattern.compile(
            "^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$"
    );

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SessionTokens tokens;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, SessionTokens tokens) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
    }

    public AuthResponse register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password is required");
        }
        if (request.getPassword().length() < 8 || request.getPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a password of at least 8 characters and at most 72 UTF-8 bytes");
        }
        if (request.getRole() == null || !SELF_REGISTERABLE_ROLES.contains(request.getRole().trim().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role must be buyer or seller");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole().trim().toLowerCase());
        userRepository.save(user);

        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null || !passwordMatches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        if (request.getRole() != null && !request.getRole().isBlank()
                && !user.getRole().equalsIgnoreCase(request.getRole())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid role for this account");
        }




        if (!isBcryptHash(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);
        }

        return toAuthResponse(user);
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (rawPassword == null || rawPassword.isBlank() || storedPassword == null) {
            return false;
        }

        if (isBcryptHash(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        return MessageDigest.isEqual(
                rawPassword.getBytes(StandardCharsets.UTF_8),
                storedPassword.getBytes(StandardCharsets.UTF_8)
        );
    }

    private boolean isBcryptHash(String password) {
        return password != null && BCRYPT_HASH.matcher(password).matches();
    }

    private AuthResponse toAuthResponse(User user) {
        var session = tokens.issue(new AuthenticatedUser(user.getId(), user.getRole(), user.getEmail()));
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), session.token(), session.expiresAt());
    }

    public void logout(String authorization) { tokens.revoke(authorization); }
}
