package com.cardapio.poli.repository;

import com.cardapio.poli.model.ComentarioLike;
import com.cardapio.poli.model.ComentarioRefeicao;
import com.cardapio.poli.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ComentarioLikeRepository extends JpaRepository<ComentarioLike, Long> {

    long countByComentario(ComentarioRefeicao comentario);

    boolean existsByUsuarioAndComentario(Usuario usuario, ComentarioRefeicao comentario);

    Optional<ComentarioLike> findByUsuarioAndComentario(Usuario usuario, ComentarioRefeicao comentario);
}
