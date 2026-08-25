package com.cardapio.poli.service;
import com.cardapio.poli.model.Refeicao;
import com.cardapio.poli.model.TipoRefeicao;
import com.cardapio.poli.repository.RefeicaoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
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
        validarTrimestreSemana(trimestre, semana);
        return repository.findByTrimestreAndSemanaOrderByTipoAscNameAsc(trimestre, semana);
    }

   public Refeicao adicionar(Refeicao refeicao){
        validar(refeicao);
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

        validar(atual);
        return repository.save(atual);
    }

    private void validar(Refeicao refeicao) {
        if (refeicao.getName() == null || refeicao.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome da refeição é obrigatório");
        }
        if (refeicao.getName().trim().length() > 160) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome da refeição deve ter no máximo 160 caracteres");
        }

        refeicao.setName(refeicao.getName().trim());
        if (refeicao.getDescription() != null) {
            refeicao.setDescription(refeicao.getDescription().trim());
        }

        validarTrimestreSemana(refeicao.getTrimestre(), refeicao.getSemana());

        try {
            refeicao.setTipo(TipoRefeicao.from(refeicao.getTipo()).name());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }

        if (refeicao.getCalories() == null || refeicao.getCalories() < 0) {
            refeicao.setCalories(0);
        }

        if (refeicao.getImageUrl() != null && !refeicao.getImageUrl().isBlank()) {
            refeicao.setImageUrl(refeicao.getImageUrl().trim());
            validarUrlImagem(refeicao.getImageUrl());
        }
    }

    private void validarTrimestreSemana(Integer trimestre, Integer semana) {
        if (trimestre == null || trimestre < 1 || trimestre > 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trimestre inválido");
        }
        if (semana == null || semana < 1 || semana > 60) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Semana inválida");
        }
    }

    private void validarUrlImagem(String imageUrl) {
        if (imageUrl.startsWith("/")) {
            return;
        }

        try {
            URI uri = new URI(imageUrl);
            String scheme = uri.getScheme();
            if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL da imagem deve usar http ou https");
            }
        } catch (URISyntaxException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL da imagem inválida");
        }
    }



}
