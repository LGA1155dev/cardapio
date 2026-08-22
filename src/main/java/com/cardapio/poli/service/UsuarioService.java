package com.cardapio.poli.service;

import com.cardapio.poli.model.Usuario;
import com.cardapio.poli.repository.UsuarioRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public UsuarioService(UsuarioRepository repository) {
        this.repository = repository;
    }

    public Usuario salvar(Usuario usuario) {

        if (repository.findByEmail(usuario.getEmail()).isPresent()) {
            throw new RuntimeException("Email já cadastrado");
        }

        usuario.setRole("USER");
        usuario.setSenha(encoder.encode(usuario.getSenha()));

        return repository.save(usuario);
    }

    public Optional<Usuario> buscarPorEmail(String email) {
        return repository.findByEmail(email);
    }

    public List<Usuario> listar() {
        return repository.findAll();
    }

    public void remover(Long id) {
        repository.deleteById(id);
    }

    public Usuario atualizar(Long id, Usuario novo) {

        Usuario atual = repository.findById(id).orElseThrow();

        atual.setNome(novo.getNome());
        atual.setEmail(novo.getEmail());
        atual.setRole(novo.getRole());

        if (novo.getSenha() != null && !novo.getSenha().isBlank()) {
            atual.setSenha(encoder.encode(novo.getSenha()));
        }

        return repository.save(atual);
    }

    public Usuario autenticar(String email, String senha) {
        Usuario user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (!encoder.matches(senha, user.getSenha())) {
            throw new RuntimeException("Senha inválida");
        }

        return user;
    }

    public Usuario autenticarOuCadastrar(String email, String senha) {
        return repository.findByEmail(email)
                .map(user -> {
                    if (!encoder.matches(senha, user.getSenha())) {
                        throw new RuntimeException("Senha inválida");
                    }

                    return user;
                })
                .orElseGet(() -> {
                    Usuario novo = new Usuario();
                    novo.setEmail(email);
                    novo.setNome(nomePadrao(email));
                    novo.setSenha(encoder.encode(senha));
                    novo.setRole("USER");
                    return repository.save(novo);
                });
    }

    private String nomePadrao(String email) {
        String prefixo = email == null ? "" : email.split("@")[0];
        return prefixo.isBlank() ? "Usuário" : prefixo;
    }
}
