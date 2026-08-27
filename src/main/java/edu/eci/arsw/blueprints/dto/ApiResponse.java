package edu.eci.arsw.blueprints.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.http.HttpStatus;

@Schema(description = "Respuesta estandar de la API")
public record ApiResponse<T>(
        @Schema(description = "Codigo de estado HTTP", example = "200")
        int code,

        @Schema(description = "Mensaje de respuesta", example = "execute ok")
        String message,

        @Schema(description = "Datos de la respuesta")
        T data
) {

    public static final String OK_MESSAGE = "execute ok";

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(HttpStatus.OK.value(), OK_MESSAGE, data);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(HttpStatus.CREATED.value(), "blueprint created", data);
    }

    public static <T> ApiResponse<T> accepted(T data) {
        return new ApiResponse<>(HttpStatus.ACCEPTED.value(), "update accepted", data);
    }

    public static <T> ApiResponse<T> error(HttpStatus status, String message, T data) {
        return new ApiResponse<>(status.value(), message, data);
    }
}
