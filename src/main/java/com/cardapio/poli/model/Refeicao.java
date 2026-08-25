package com.cardapio.poli.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
public class Refeicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    @Setter
    private Long id;
    @Getter
    @Setter
    private String name;
    @Getter
    @Setter
    private String dayWeek;
    @Getter
    @Setter
    private String description;
    @Getter
    @Setter
    private Integer calories;
    @Getter
    @Setter
    private String imageUrl;
    @Getter
    @Setter
    private Integer trimestre;
    @Getter
    @Setter
    private Integer semana;
    @Getter
    @Setter
    private String tipo;


    public Refeicao(Long id, String name, String dayWeek, String description, Integer calories, String imageUrl) {
        this.id = id;
        this.name = name;
        this.dayWeek = dayWeek;
        this.description = description;
        this.calories = calories;
        this.imageUrl = imageUrl;
    }

    public Refeicao() {

    }

    @PrePersist
    @PreUpdate
    private void aplicarPadroes() {
        if (trimestre == null) {
            trimestre = 2;
        }
        if (semana == null) {
            semana = 4;
        }
        if (tipo == null || tipo.isBlank()) {
            tipo = TipoRefeicao.ALMOCO.name();
        } else {
            tipo = TipoRefeicao.from(tipo).name();
        }
    }
}
