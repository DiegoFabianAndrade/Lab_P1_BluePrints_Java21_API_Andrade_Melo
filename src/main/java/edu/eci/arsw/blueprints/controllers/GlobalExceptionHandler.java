package edu.eci.arsw.blueprints.controllers;

import edu.eci.arsw.blueprints.dto.ApiResponse;
import edu.eci.arsw.blueprints.persistence.BlueprintNotFoundException;
import edu.eci.arsw.blueprints.persistence.BlueprintPersistenceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Traduce las excepciones de la aplicacion a respuestas HTTP.
 *
 * <p>Centralizar el manejo de errores aqui evita repetir bloques {@code try/catch}
 * en cada metodo del controlador y garantiza que <b>los errores usen el mismo sobre
 * {@link ApiResponse} que las respuestas exitosas</b>: quien consume la API nunca
 * recibe una estructura sorpresa.</p>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** 404: se pidio un plano o un autor que no existe. */
    @ExceptionHandler(BlueprintNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(BlueprintNotFoundException ex) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    /**
     * 409: el recurso choca con el estado actual (por ejemplo, crear un plano que ya
     * existe). Antes se devolvia 403 Forbidden, que es incorrecto: 403 significa
     * "no tienes permiso", y aqui el problema no es de autorizacion sino de conflicto.
     */
    @ExceptionHandler(BlueprintPersistenceException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(BlueprintPersistenceException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    /** 400: el cuerpo llego con campos que incumplen las restricciones de validacion. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> errors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        ApiResponse<Map<String, String>> body =
                ApiResponse.error(HttpStatus.BAD_REQUEST, "datos invalidos", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /** 400: el JSON esta mal formado o un campo no tiene el tipo esperado. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadable(HttpMessageNotReadableException ex) {
        return build(HttpStatus.BAD_REQUEST, "cuerpo de la peticion invalido o mal formado", null);
    }

    /**
     * 404: la ruta solicitada no corresponde a ningun endpoint.
     *
     * <p>Debe declararse explicitamente: sin este metodo, el manejador generico de
     * {@link Exception} atrapa la excepcion interna de Spring y responde 500 a una
     * peticion que en realidad solo apunta a una URL inexistente.</p>
     */
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<ApiResponse<Void>> handleNoHandler(Exception ex) {
        return build(HttpStatus.NOT_FOUND, "recurso no encontrado", null);
    }

    /** 405: la ruta existe, pero no admite ese metodo HTTP. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, ex.getMessage(), null);
    }

    /**
     * 500: red de seguridad para lo imprevisto.
     *
     * <p>Se registra la traza completa en el log, pero al cliente solo se le devuelve
     * un mensaje generico: exponer detalles internos en la respuesta es una fuga de
     * informacion.</p>
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex) {
        log.error("Error no controlado atendiendo la peticion", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "error interno del servidor", null);
    }

    private <T> ResponseEntity<ApiResponse<T>> build(HttpStatus status, String message, T data) {
        return ResponseEntity.status(status).body(ApiResponse.error(status, message, data));
    }
}
