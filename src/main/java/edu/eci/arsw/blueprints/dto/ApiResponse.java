package edu.eci.arsw.blueprints.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.http.HttpStatus;

/**
 * Sobre uniforme para todas las respuestas de la API.
 *
 * <p>Cualquier endpoint, tenga exito o falle, responde siempre con la misma forma:</p>
 *
 * <pre>{@code
 * { "code": 200, "message": "execute ok", "data": { ... } }
 * }</pre>
 *
 * <p>De este modo el cliente no tiene que adivinar la estructura segun el caso: sabe
 * que siempre encontrara un codigo, un mensaje legible y, cuando aplique, los datos.
 * En los errores {@code data} viaja en {@code null} o con el detalle de la validacion.</p>
 *
 * @param <T> tipo del contenido devuelto en {@code data}
 */
@Schema(description = "Sobre uniforme de respuesta de la API")
public record ApiResponse<T>(
        @Schema(description = "Codigo HTTP de la respuesta", example = "200")
        int code,

        @Schema(description = "Mensaje legible sobre el resultado", example = "execute ok")
        String message,

        @Schema(description = "Contenido de la respuesta; null cuando no aplica")
        T data
) {

    /** Mensaje estandar para las operaciones que terminan bien. */
    public static final String OK_MESSAGE = "execute ok";

    /** 200 OK: consulta resuelta correctamente. */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(HttpStatus.OK.value(), OK_MESSAGE, data);
    }

    /** 201 Created: recurso creado. */
    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(HttpStatus.CREATED.value(), "blueprint created", data);
    }

    /** 202 Accepted: actualizacion aceptada. */
    public static <T> ApiResponse<T> accepted(T data) {
        return new ApiResponse<>(HttpStatus.ACCEPTED.value(), "update accepted", data);
    }

    /** Respuesta de error: conserva la misma forma que las exitosas. */
    public static <T> ApiResponse<T> error(HttpStatus status, String message, T data) {
        return new ApiResponse<>(status.value(), message, data);
    }
}
