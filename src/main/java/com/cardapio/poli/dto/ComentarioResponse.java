package com.cardapio.poli.dto;

import java.time.LocalDateTime;

public record ComentarioResponse(
        Long id,
        String usuarioNome,
        String texto,
        Long likes,
        Boolean curtidoPorMim,
        LocalDateTime dataHora
) {
}
