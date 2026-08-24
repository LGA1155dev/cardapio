package com.cardapio.poli.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(uniqueConstraints = {
        @UniqueConstraint(name = "uk_like_usuario_comentario", columnNames = {"usuario_id", "comentario_id"})
})
@Getter
@Setter
public class ComentarioLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "comentario_id", nullable = false)
    private ComentarioRefeicao comentario;

    @Column(nullable = false)
    private LocalDateTime dataHora;
}
