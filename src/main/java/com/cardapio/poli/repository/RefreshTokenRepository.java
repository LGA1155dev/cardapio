package com.cardapio.poli.repository;

import com.cardapio.poli.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUsuarioId(Long usuarioId);
    void deleteByToken(String token);
}
