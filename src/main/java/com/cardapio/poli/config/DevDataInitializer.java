package com.cardapio.poli.config;

import com.cardapio.poli.model.Usuario;
import com.cardapio.poli.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
@Profile("dev")
public class DevDataInitializer {

    @Bean
    CommandLineRunner seedAdminUser(UsuarioRepository usuarios) {
        return args -> usuarios.findByEmail("admin@poli.com").map(admin -> {
            if (!"ADMIN".equalsIgnoreCase(admin.getRole())) {
                admin.setRole("ADMIN");
                return usuarios.save(admin);
            }

            return admin;
        }).orElseGet(() -> {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            Usuario admin = new Usuario();
            admin.setNome("Administrador");
            admin.setEmail("admin@poli.com");
            admin.setSenha(encoder.encode("admin123"));
            admin.setRole("ADMIN");
            return usuarios.save(admin);
        });
    }
}
