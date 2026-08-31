package com.cardapio.poli.security.config;

import com.cardapio.poli.model.Usuario;
import com.cardapio.poli.repository.RefreshTokenRepository;
import com.cardapio.poli.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UsuarioAuthFlowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        usuarioRepository.deleteAll();
        salvarUsuario("User", "user@poli.com", "user123", "USER");
    }

    @Test
    void loginComUsuarioInexistenteRetornaNotFound() throws Exception {
        mockMvc.perform(post("/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("novo@poli.com", "user123")))
                .andExpect(status().isNotFound());
    }

    @Test
    void loginComSenhaIncorretaRetornaUnauthorized() throws Exception {
        mockMvc.perform(post("/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("user@poli.com", "senha-errada")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cadastroComEmailExistenteRetornaConflict() throws Exception {
        mockMvc.perform(post("/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(usuarioJson("Outro User", "user@poli.com", "user123")))
                .andExpect(status().isConflict());
    }

    @Test
    void cadastroNovoPermiteLoginComJwt() throws Exception {
        mockMvc.perform(post("/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(usuarioJson("Novo User", "novo@poli.com", "user123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("novo@poli.com"))
                .andExpect(jsonPath("$.role").value("USER"));

        mockMvc.perform(post("/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("novo@poli.com", "user123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.usuario.email").value("novo@poli.com"));
    }

    private void salvarUsuario(String nome, String email, String senha, String role) {
        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setSenha(encoder.encode(senha));
        usuario.setRole(role);
        usuarioRepository.save(usuario);
    }

    private String loginJson(String email, String senha) {
        return """
                {
                  "email": "%s",
                  "senha": "%s"
                }
                """.formatted(email, senha);
    }

    private String usuarioJson(String nome, String email, String senha) {
        return """
                {
                  "nome": "%s",
                  "email": "%s",
                  "senha": "%s"
                }
                """.formatted(nome, email, senha);
    }
}
