package com.cardapio.poli.repository;

import com.cardapio.poli.model.Avaliacao;
import com.cardapio.poli.model.Refeicao;
import com.cardapio.poli.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    List<Avaliacao> findByRefeicaoOrderByDataHoraDesc(Refeicao refeicao);

    Optional<Avaliacao> findByUsuarioAndRefeicao(Usuario usuario, Refeicao refeicao);
}
