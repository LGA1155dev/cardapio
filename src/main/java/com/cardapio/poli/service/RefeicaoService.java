package com.cardapio.poli.service;
import com.cardapio.poli.model.Refeicao;
import com.cardapio.poli.repository.RefeicaoRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RefeicaoService {
    private final RefeicaoRepository repository;

    public RefeicaoService(RefeicaoRepository repository ){
            this.repository = repository;
    }

    public List<Refeicao> listar(){
        return repository.findAll();
    }

    public List<Refeicao> listarPorSemana(Integer trimestre, Integer semana){
        return repository.findByTrimestreAndSemana(trimestre, semana);
    }

   public Refeicao adicionar(Refeicao refeicao){
        return repository.save(refeicao);
    }


    public void remover(Long Id){
            repository.deleteById(Id);
    }

    public Refeicao buscarPorId(Long id){
        return repository.findById(id)
                .orElseThrow(
                        () -> new RuntimeException("Refeiçao não encontrada!")
                );
    }

    public Refeicao atualizar(
            Long id,
            Refeicao nova
    ){
        Refeicao atual =
                repository.findById(id)
                                .orElseThrow();

        atual.setName(nova.getName());
        atual.setDescription(nova.getDescription());
        atual.setDayWeek(nova.getDayWeek());
        atual.setCalories(nova.getCalories());
        atual.setImageUrl(nova.getImageUrl());
        atual.setTrimestre(nova.getTrimestre());
        atual.setSemana(nova.getSemana());
        atual.setTipo(nova.getTipo());

        return repository.save(atual);
    }




}
