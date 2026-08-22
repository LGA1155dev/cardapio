package com.cardapio.poli.security.auth;

import com.cardapio.poli.dto.UsuarioResponse;
import lombok.Getter;

public class LoginResponse {
    @Getter
    private String accessToken;

    @Getter
    private UsuarioResponse usuario;

    public LoginResponse(String accessToken, UsuarioResponse usuario) {
        this.accessToken = accessToken;
        this.usuario = usuario;
    }

}
