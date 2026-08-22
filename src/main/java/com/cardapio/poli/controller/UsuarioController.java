package com.cardapio.poli.controller;
import com.cardapio.poli.dto.UsuarioResponse;
import com.cardapio.poli.model.RefreshToken;
import com.cardapio.poli.model.Usuario;
import com.cardapio.poli.security.auth.LoginResponse;
import com.cardapio.poli.security.jwt.JwtUtil;
import com.cardapio.poli.security.service.UsuarioDetails;
import com.cardapio.poli.service.RefreshTokenService;
import com.cardapio.poli.service.UsuarioService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {
                private final UsuarioService service;
                private final JwtUtil jwtUtil;
                private final RefreshTokenService refreshTokenService;
                private final boolean refreshCookieSecure;
                private final String refreshCookieSameSite;


                public UsuarioController(
                        UsuarioService service,
                        JwtUtil jwtUtil,
                        RefreshTokenService refreshTokenService,
                        @Value("${app.refresh-cookie.secure:false}") boolean refreshCookieSecure,
                        @Value("${app.refresh-cookie.same-site:Strict}") String refreshCookieSameSite
                ){
                    this.service = service;
                    this.jwtUtil = jwtUtil;
                    this.refreshTokenService = refreshTokenService;
                    this.refreshCookieSecure = refreshCookieSecure;
                    this.refreshCookieSameSite = refreshCookieSameSite;
                }

    @GetMapping("/admin")
    public UsuarioResponse admin() {
        Usuario admin = service
                .buscarPorEmail("admin@poli.com")
                .orElseThrow();

        return toResponse(admin);
    }

    @PostMapping
    public UsuarioResponse criar(
            @Valid @RequestBody Usuario usuario
    ){
                    usuario.setRole("USER");
                    return toResponse(service.salvar(usuario));
    }

    @GetMapping("/{email}")
    public UsuarioResponse buscar(
            @PathVariable String email
    ){
                    return toResponse(service.buscarPorEmail(email)
                            .orElseThrow());
    }

    @GetMapping
    public List<UsuarioResponse> listar(){
        return service.listar().stream()
                .map(u -> new UsuarioResponse(
                        u.getId(),
                        u.getNome(),
                        u.getEmail(),
                        u.getRole()
                ))
                .toList();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody Usuario usuario, HttpServletResponse response) {

        Usuario auth = service.autenticar(usuario.getEmail(), usuario.getSenha());

        UserDetails userDetails = new UsuarioDetails(auth);

        String accessToken = jwtUtil.generateAccessToken(userDetails);

        RefreshToken refresh = refreshTokenService.create(auth);

        response.addHeader(HttpHeaders.SET_COOKIE, buildRefreshCookie(refresh.getToken()).toString());

        return ResponseEntity.ok(new LoginResponse(accessToken, toResponse(auth)));
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id){
                    service.remover(id);
    }

    @PutMapping("/{id}")
    public UsuarioResponse atualizar(
            @PathVariable Long id,
            @RequestBody Usuario usuario
    ){
                    return toResponse(service.atualizar(id, usuario));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(HttpServletRequest request) {

        String refreshToken = extractRefreshToken(request);

        RefreshToken oldToken = refreshTokenService.verify(refreshToken);

        UserDetails userDetails = new UsuarioDetails(oldToken.getUsuario());

        String newAccessToken = jwtUtil.generateAccessToken(userDetails);

        refreshTokenService.delete(oldToken);
        RefreshToken newRefresh = refreshTokenService.create(oldToken.getUsuario());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(newRefresh.getToken()).toString())
                .body(new LoginResponse(newAccessToken, toResponse(oldToken.getUsuario())));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String refreshToken = extractRefreshTokenOrNull(request);

        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.deleteByToken(refreshToken);
        }

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, buildClearRefreshCookie().toString())
                .build();
    }

    @GetMapping("/me")
    public UsuarioResponse me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado");
        }

        Usuario usuario = service.buscarPorEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado"));

        return toResponse(usuario);
    }

    @GetMapping("/ping")
    public String ping() {
        return "ok";
    }

    private UsuarioResponse toResponse(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getRole()
        );
    }

    private String extractRefreshToken(HttpServletRequest request) {
        String token = extractRefreshTokenOrNull(request);

        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token ausente");
        }

        return token;
    }

    private String extractRefreshTokenOrNull(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();

        if (cookies == null) {
            return null;
        }

        return Arrays.stream(cookies)
                .filter(c -> c.getName().equals("refreshToken"))
                .findFirst()
                .map(Cookie::getValue)
                .orElse(null);
    }

    private ResponseCookie buildRefreshCookie(String refreshToken) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path("/usuarios")
                .maxAge(Duration.ofDays(7))
                .build();
    }

    private ResponseCookie buildClearRefreshCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path("/usuarios")
                .maxAge(Duration.ZERO)
                .build();
    }
}
