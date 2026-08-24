package com.cardapio.poli.repository;
import  com.cardapio.poli.model.Refeicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RefeicaoRepository extends JpaRepository<Refeicao, Long> {

    List<Refeicao> findByTrimestreAndSemana(Integer trimestre, Integer semana);
}
