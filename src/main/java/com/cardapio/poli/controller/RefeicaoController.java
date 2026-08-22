package com.cardapio.poli.controller;
import com.cardapio.poli.model.Refeicao;
import com.cardapio.poli.service.RefeicaoService;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/refeicao")
public class RefeicaoController {

    private final RefeicaoService service;

    public RefeicaoController(RefeicaoService service){
        this.service = service;
    }

    @GetMapping
    public List<Refeicao> listar() {
        return service.listar();
    }

    @PostMapping
    public Refeicao criar(
            @RequestBody Refeicao refeicao
    ){
        service.adicionar(refeicao);

        return refeicao;
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id){
        service.remover(id);
    }

    @GetMapping("/{id}")
    public Refeicao buscar(
            @PathVariable Long id
    ){
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public Refeicao atualizar(
            @PathVariable Long id,
            @RequestBody Refeicao refeicao
    ){
        return service.atualizar(id, refeicao);
    }

}
