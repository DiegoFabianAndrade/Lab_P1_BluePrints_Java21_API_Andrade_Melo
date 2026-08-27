package edu.eci.arsw.blueprints.dto;

import edu.eci.arsw.blueprints.model.Point;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * Cuerpo esperado al crear un plano nuevo.
 *
 * <p>Es un DTO de entrada: separa lo que el cliente puede enviar de la entidad de
 * dominio {@link edu.eci.arsw.blueprints.model.Blueprint}. Las anotaciones de
 * validacion hacen que una peticion mal formada se rechace con 400 antes de llegar
 * a la capa de servicios.</p>
 */
@Schema(description = "Datos para crear un plano")
public record NewBlueprintRequest(

        @Schema(description = "Autor del plano", example = "john")
        @NotBlank(message = "el autor es obligatorio")
        String author,

        @Schema(description = "Nombre del plano", example = "kitchen")
        @NotBlank(message = "el nombre es obligatorio")
        String name,

        @Schema(description = "Secuencia ordenada de puntos que componen el plano")
        @Valid
        List<Point> points
) { }
