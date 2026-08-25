package com.cardapio.poli.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

@Service
public class ImagemRefeicaoService {

    private final RestClient restClient;
    private final String provider;
    private final String apiKey;
    private final String endpoint;

    public ImagemRefeicaoService(
            RestClient.Builder restClientBuilder,
            @Value("${IMAGE_GENERATION_PROVIDER:${image.generation.provider:}}") String provider,
            @Value("${IMAGE_GENERATION_API_KEY:${image.generation.api-key:}}") String apiKey,
            @Value("${IMAGE_GENERATION_ENDPOINT:${image.generation.endpoint:}}") String endpoint
    ) {
        this.restClient = restClientBuilder.build();
        this.provider = provider == null ? "" : provider.trim().toLowerCase(Locale.ROOT);
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.endpoint = endpoint == null ? "" : endpoint.trim();
    }

    public String gerarImagem(String nome) {
        if (nome == null || nome.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome da refeição é obrigatório");
        }

        if (provider.isBlank() || apiKey.isBlank() || endpoint.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Geração automática de imagem não configurada. Informe uma URL manualmente."
            );
        }

        if (!"custom-http".equals(provider)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_IMPLEMENTED,
                    "Provider de geração de imagem não suportado: " + provider
            );
        }

        String prompt = montarPrompt(nome);

        try {
            ImageProviderResponse response = restClient
                    .post()
                    .uri(endpoint)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(Map.of("prompt", prompt))
                    .retrieve()
                    .body(ImageProviderResponse.class);

            String imageUrl = response == null ? null : response.imageUrl();
            if (imageUrl == null || imageUrl.isBlank()) {
                imageUrl = response == null ? null : response.url();
            }

            if (imageUrl == null || imageUrl.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Provider não retornou uma URL de imagem");
            }

            return imageUrl.trim();
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível gerar a imagem automaticamente",
                    ex
            );
        }
    }

    private String montarPrompt(String nome) {
        return "Fotografia realista e apetitosa de uma refeição escolar contendo: "
                + nome.trim()
                + ". Apresentação limpa, iluminação natural, prato visto de forma clara, sem pessoas, sem texto, sem logotipos e sem marcas d'água.";
    }

    private record ImageProviderResponse(String imageUrl, String url) {
    }
}
