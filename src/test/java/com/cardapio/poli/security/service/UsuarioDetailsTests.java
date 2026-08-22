package com.cardapio.poli.security.service;

import com.cardapio.poli.model.Usuario;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UsuarioDetailsTests {

    @Test
    void normalizaRoleAdminSemDuplicarPrefixo() {
        assertAuthority("ADMIN", "ROLE_ADMIN");
        assertAuthority("admin", "ROLE_ADMIN");
        assertAuthority("ROLE_ADMIN", "ROLE_ADMIN");
    }

    @Test
    void usaUserQuandoRoleNaoExiste() {
        assertAuthority(null, "ROLE_USER");
        assertAuthority("", "ROLE_USER");
    }

    private void assertAuthority(String role, String expectedAuthority) {
        Usuario usuario = new Usuario();
        usuario.setEmail("admin@poli.com");
        usuario.setSenha("senha");
        usuario.setRole(role);

        UsuarioDetails details = new UsuarioDetails(usuario);

        assertThat(details.getAuthorities())
                .extracting(Object::toString)
                .containsExactly(expectedAuthority);
    }
}
