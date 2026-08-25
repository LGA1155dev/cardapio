package com.cardapio.poli.controller;
import com.cardapio.poli.model.Refeicao;
import com.cardapio.poli.model.Avaliacao;
import com.cardapio.poli.model.ComentarioLike;
import com.cardapio.poli.model.ComentarioRefeicao;
import com.cardapio.poli.model.Usuario;
import com.cardapio.poli.dto.AvaliacaoRequest;
import com.cardapio.poli.dto.AvaliacaoResponse;
import com.cardapio.poli.dto.AvaliacaoResumoResponse;
import com.cardapio.poli.dto.ComentarioRequest;
import com.cardapio.poli.dto.ComentarioResponse;
import com.cardapio.poli.dto.GerarImagemRequest;
import com.cardapio.poli.dto.GerarImagemResponse;
import com.cardapio.poli.repository.AvaliacaoRepository;
import com.cardapio.poli.repository.ComentarioLikeRepository;
import com.cardapio.poli.repository.ComentarioRefeicaoRepository;
import com.cardapio.poli.service.ImagemRefeicaoService;
import com.cardapio.poli.service.RefeicaoService;
import com.cardapio.poli.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/refeicao")
public class RefeicaoController {

    private final RefeicaoService service;
    private final UsuarioService usuarioService;
    private final ComentarioRefeicaoRepository comentarioRepository;
    private final ComentarioLikeRepository comentarioLikeRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final ImagemRefeicaoService imagemRefeicaoService;

    public RefeicaoController(
            RefeicaoService service,
            UsuarioService usuarioService,
            ComentarioRefeicaoRepository comentarioRepository,
            ComentarioLikeRepository comentarioLikeRepository,
            AvaliacaoRepository avaliacaoRepository,
            ImagemRefeicaoService imagemRefeicaoService
    ){
        this.service = service;
        this.usuarioService = usuarioService;
        this.comentarioRepository = comentarioRepository;
        this.comentarioLikeRepository = comentarioLikeRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.imagemRefeicaoService = imagemRefeicaoService;
    }

    @GetMapping
    public List<Refeicao> listar(
            @RequestParam(required = false) Integer trimestre,
            @RequestParam(required = false) Integer semana
    ) {
        if (trimestre != null || semana != null) {
            if (trimestre == null || semana == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe trimestre e semana");
            }
            return service.listarPorSemana(trimestre, semana);
        }

        return service.listar();
    }

    @GetMapping("/semana")
    public List<Refeicao> listarSemana(
            @RequestParam Integer trimestre,
            @RequestParam Integer semana
    ) {
        return service.listarPorSemana(trimestre, semana);
    }

    @PostMapping
    public Refeicao criar(
            @RequestBody Refeicao refeicao
    ){
        return service.adicionar(refeicao);
    }

    @PostMapping("/gerar-imagem")
    public GerarImagemResponse gerarImagem(@Valid @RequestBody GerarImagemRequest request) {
        String imageUrl = imagemRefeicaoService.gerarImagem(request.nome());
        return new GerarImagemResponse(imageUrl, "Imagem gerada com sucesso");
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

    @GetMapping("/{id}/comentarios")
    public List<ComentarioResponse> listarComentarios(@PathVariable Long id, Authentication authentication) {
        Refeicao refeicao = service.buscarPorId(id);
        Usuario usuario = usuarioAutenticadoOuNull(authentication);

        return comentarioRepository.findByRefeicaoOrderByDataHoraAsc(refeicao).stream()
                .map(comentario -> toComentarioResponse(comentario, usuario))
                .toList();
    }

    @PostMapping("/{id}/comentarios")
    public ResponseEntity<ComentarioResponse> comentar(
            @PathVariable Long id,
            @Valid @RequestBody ComentarioRequest request,
            Authentication authentication
    ) {
        Usuario usuario = usuarioAutenticado(authentication);
        Refeicao refeicao = service.buscarPorId(id);

        ComentarioRefeicao comentario = new ComentarioRefeicao();
        comentario.setUsuario(usuario);
        comentario.setRefeicao(refeicao);
        comentario.setTexto(request.texto().trim());
        comentario.setDataHora(LocalDateTime.now());

        ComentarioRefeicao salvo = comentarioRepository.save(comentario);
        return ResponseEntity.status(HttpStatus.CREATED).body(toComentarioResponse(salvo, usuario));
    }

    @PostMapping("/comentarios/{comentarioId}/likes")
    public ComentarioResponse curtirComentario(
            @PathVariable Long comentarioId,
            Authentication authentication
    ) {
        Usuario usuario = usuarioAutenticado(authentication);
        ComentarioRefeicao comentario = comentarioRepository.findById(comentarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comentário não encontrado"));

        if (!comentarioLikeRepository.existsByUsuarioAndComentario(usuario, comentario)) {
            ComentarioLike like = new ComentarioLike();
            like.setUsuario(usuario);
            like.setComentario(comentario);
            like.setDataHora(LocalDateTime.now());
            comentarioLikeRepository.save(like);
        }

        return toComentarioResponse(comentario, usuario);
    }

    @GetMapping("/{id}/avaliacoes")
    public AvaliacaoResumoResponse resumoAvaliacoes(@PathVariable Long id, Authentication authentication) {
        Refeicao refeicao = service.buscarPorId(id);
        Usuario usuario = usuarioAutenticadoOuNull(authentication);
        List<Avaliacao> avaliacoes = avaliacaoRepository.findByRefeicaoOrderByDataHoraDesc(refeicao);
        long quantidade = avaliacoes.size();
        double media = quantidade == 0
                ? 0.0
                : avaliacoes.stream().mapToInt(Avaliacao::getNota).average().orElse(0.0);
        Integer minhaNota = usuario == null
                ? null
                : avaliacaoRepository.findByUsuarioAndRefeicaoAndDataAvaliacao(usuario, refeicao, LocalDate.now())
                        .map(Avaliacao::getNota)
                        .orElse(null);

        List<AvaliacaoResponse> respostas = avaliacoes.stream()
                .map(avaliacao -> new AvaliacaoResponse(
                        avaliacao.getId(),
                        avaliacao.getUsuario().getNome(),
                        avaliacao.getNota(),
                        avaliacao.getDataHora()
                ))
                .toList();

        return new AvaliacaoResumoResponse(
                Math.round(media * 10.0) / 10.0,
                quantidade,
                minhaNota,
                quantidade == 1 ? "1 pessoa avaliou" : quantidade + " pessoas avaliaram",
                respostas
        );
    }

    @PostMapping("/{id}/avaliacoes")
    public AvaliacaoResumoResponse avaliar(
            @PathVariable Long id,
            @Valid @RequestBody AvaliacaoRequest request,
            Authentication authentication
    ) {
        Usuario usuario = usuarioAutenticado(authentication);
        Refeicao refeicao = service.buscarPorId(id);
        LocalDate hoje = LocalDate.now();

        avaliacaoRepository.findByUsuarioAndRefeicaoAndDataAvaliacao(usuario, refeicao, hoje)
                .ifPresent(avaliacao -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Você já avaliou esta comida hoje");
                });

        Avaliacao avaliacao = new Avaliacao();
        avaliacao.setUsuario(usuario);
        avaliacao.setRefeicao(refeicao);
        avaliacao.setNota(request.nota());
        avaliacao.setDataAvaliacao(hoje);
        avaliacao.setDataHora(LocalDateTime.now());
        avaliacaoRepository.save(avaliacao);

        return resumoAvaliacoes(id, authentication);
    }

    private ComentarioResponse toComentarioResponse(ComentarioRefeicao comentario, Usuario usuario) {
        return new ComentarioResponse(
                comentario.getId(),
                comentario.getUsuario().getNome(),
                comentario.getTexto(),
                comentarioLikeRepository.countByComentario(comentario),
                usuario != null && comentarioLikeRepository.existsByUsuarioAndComentario(usuario, comentario),
                comentario.getDataHora()
        );
    }

    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faça login para continuar");
        }

        return usuarioService.buscarPorEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado"));
    }

    private Usuario usuarioAutenticadoOuNull(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }

        return usuarioService.buscarPorEmail(authentication.getName()).orElse(null);
    }
}
