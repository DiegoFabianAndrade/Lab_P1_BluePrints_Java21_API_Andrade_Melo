package edu.eci.arsw.blueprints.dto;

import edu.eci.arsw.blueprints.model.Point;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

@Schema(description = "Datos para crear un plano")
public record NewBlueprintRequest(

        @Schema(description = "Autor del plano", example = "john")
        @NotBlank(message = "el autor es obligatorio")
        String author,

        @Schema(description = "Nombre del plano", example = "kitchen")
        @NotBlank(message = "el nombre es obligatorio")
        String name,

        @Schema(description = "Puntos que componen el plano")
        @Valid
        List<Point> points
) { }
