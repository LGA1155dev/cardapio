package com.cardapio.poli.security.config;

import com.cardapio.poli.model.Usuario;
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

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RefeicaoSecurityTests {

    private static final Pattern ACCESS_TOKEN_PATTERN = Pattern.compile("\"accessToken\"\\s*:\\s*\"([^\"]+)\"");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
        salvarUsuario("Admin", "admin@poli.com", "admin123", "ADMIN");
        salvarUsuario("User", "user@poli.com", "user123", "USER");
    }

    @Test
    void getRefeicaoRaizContinuaPublico() throws Exception {
        mockMvc.perform(get("/refeicao"))
                .andExpect(status().isOk());
    }

    @Test
    void postRefeicaoSemTokenNaoAutentica() throws Exception {
        mockMvc.perform(post("/refeicao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refeicaoJson()))
                .andExpect(status().isForbidden());
    }

    @Test
    void postRefeicaoComUsuarioComumNaoAutoriza() throws Exception {
        String token = login("user@poli.com", "user123");

        mockMvc.perform(post("/refeicao")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refeicaoJson()))
                .andExpect(status().isForbidden());
    }

    @Test
    void postRefeicaoComAdminAutoriza() throws Exception {
        String token = login("admin@poli.com", "admin123");

        mockMvc.perform(post("/refeicao")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refeicaoJson()))
                .andExpect(status().isOk());
    }

    private void salvarUsuario(String nome, String email, String senha, String role) {
        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setSenha(encoder.encode(senha));
        usuario.setRole(role);
        usuarioRepository.save(usuario);
    }

    private String login(String email, String senha) throws Exception {
        String response = mockMvc.perform(post("/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "senha": "%s"
                                }
                                """.formatted(email, senha)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Matcher matcher = ACCESS_TOKEN_PATTERN.matcher(response);
        if (!matcher.find()) {
            throw new AssertionError("Login response did not include accessToken");
        }

        return matcher.group(1);
    }

    private String refeicaoJson() {
        return """
                {
                  "name": "Arroz, feijao e salada",
                  "description": "Prato de teste",
                  "dayWeek": "Segunda-feira",
                  "calories": 420,
                  "imageUrl": "https://example.com/refeicao.jpg",
                  "trimestre": 2,
                  "semana": 4,
                  "tipo": "ALMOCO"
                }
                """;
    }
}
