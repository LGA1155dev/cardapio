package com.cardapio.poli.security.auth;

import lombok.Getter;
import lombok.Setter;

public class RefreshTokenRequest {
    @Getter
    @Setter
    private String refreshToken;

}