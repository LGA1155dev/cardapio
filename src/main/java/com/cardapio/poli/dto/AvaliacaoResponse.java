package com.cardapio.poli.dto;

import java.time.LocalDateTime;

public record AvaliacaoResponse(
        Long id,
        String usuarioNome,
        Integer nota,
        LocalDateTime dataHora
) {
}
