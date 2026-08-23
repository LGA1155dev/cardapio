package com.cardapio.poli.repository;

import com.cardapio.poli.model.ComentarioRefeicao;
import com.cardapio.poli.model.Refeicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComentarioRefeicaoRepository extends JpaRepository<ComentarioRefeicao, Long> {

    List<ComentarioRefeicao> findByRefeicaoOrderByDataHoraAsc(Refeicao refeicao);
}
