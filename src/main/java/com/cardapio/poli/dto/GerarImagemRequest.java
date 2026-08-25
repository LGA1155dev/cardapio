package com.cardapio.poli.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GerarImagemRequest(
        @NotBlank @Size(max = 160) String nome
) {
}
