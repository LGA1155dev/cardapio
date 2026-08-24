package com.cardapio.poli.dto;

import java.util.List;

public record AvaliacaoResumoResponse(
        Double media,
        Long quantidade,
        Integer minhaNota,
        String textoQuantidade,
        List<AvaliacaoResponse> avaliacoes
) {
}
