package edu.eci.arsw.blueprints.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Politica CORS para el cliente React de la Parte 5.
 *
 * <p>El cliente SPA se sirve desde un origen distinto al del API (Vite en
 * {@code http://localhost:5173}, o el contenedor estatico en
 * {@code http://localhost:4173}), de modo que el navegador exige una respuesta
 * CORS explicita antes de entregar los datos al codigo JavaScript.</p>
 *
 * <p>Los origenes permitidos se configuran con la propiedad
 * {@code blueprints.cors.allowed-origins} (lista separada por comas), de forma
 * que en despliegue se restringen sin recompilar.</p>
 */
@Configuration
public class CorsConfig {

    private final List<String> allowedOrigins;

    public CorsConfig(
            @Value("${blueprints.cors.allowed-origins:http://localhost:5173,http://localhost:4173}")
            List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setExposedHeaders(List.of("Location"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        source.registerCorsConfiguration("/auth/**", config);
        source.registerCorsConfiguration("/ws-blueprints/**", config);
        return source;
    }
}
