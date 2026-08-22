package com.cardapio.poli.service;

import com.cardapio.poli.model.RefreshToken;
import com.cardapio.poli.model.Usuario;
import com.cardapio.poli.repository.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;

    private final long EXPIRATION = 1000L * 60 * 60 * 24 * 7; // 7 dias

    public RefreshTokenService(RefreshTokenRepository repository) {
        this.repository = repository;
    }

    public RefreshToken create(Usuario user) {

        RefreshToken token = new RefreshToken();
        token.setUsuario(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiryDate(Instant.now().plusMillis(EXPIRATION));

        return repository.save(token);
    }

    public RefreshToken verify(String token) {

        RefreshToken rt = repository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token inválido"));

        if (rt.getExpiryDate().isBefore(Instant.now())) {
            repository.delete(rt);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expirado");
        }

        return rt;
    }

    public void delete(RefreshToken token) {
        repository.delete(token);
    }

    @Transactional
    public void deleteByToken(String token) {
        repository.deleteByToken(token);
    }

    @Transactional
    public void deleteByUser(Long userId) {
        repository.deleteByUsuarioId(userId);
    }
}
