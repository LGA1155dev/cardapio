package com.cardapio.poli.model;

import java.util.Arrays;
import java.util.Locale;

public enum TipoRefeicao {
    CAFE_DA_MANHA,
    ALMOCO,
    SUCO,
    SOBREMESA;

    public static TipoRefeicao from(String value) {
        if (value == null || value.isBlank()) {
            return ALMOCO;
        }

        String normalized = value
                .trim()
                .toUpperCase(Locale.ROOT)
                .replace('É', 'E')
                .replace('Ê', 'E')
                .replace('Ã', 'A')
                .replace('Ç', 'C')
                .replace(' ', '_')
                .replace("-", "_");

        if ("CAFE".equals(normalized) || "CAFE_DA_MANHA".equals(normalized) || "CAFES_DA_MANHA".equals(normalized)) {
            return CAFE_DA_MANHA;
        }
        if ("ALMOCO".equals(normalized) || "ALMOCOS".equals(normalized)) {
            return ALMOCO;
        }
        if ("SUCO".equals(normalized) || "SUCOS".equals(normalized)) {
            return SUCO;
        }
        if ("SOBREMESA".equals(normalized) || "SOBREMESAS".equals(normalized)) {
            return SOBREMESA;
        }

        return Arrays.stream(values())
                .filter(tipo -> tipo.name().equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Tipo de refeição inválido"));
    }
}
