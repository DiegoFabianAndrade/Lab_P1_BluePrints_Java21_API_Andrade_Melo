package edu.eci.arsw.blueprints.dto;

import edu.eci.arsw.blueprints.model.Point;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Cuerpo esperado al reemplazar la secuencia de puntos de un plano.
 *
 * <p>El autor y el nombre identifican el recurso y viajan en la ruta, de modo que
 * el cuerpo solo transporta lo que realmente cambia: los puntos. Si el cliente
 * envia tambien autor y nombre, se ignoran.</p>
 */
@Schema(description = "Nueva secuencia de puntos de un plano existente")
public record UpdateBlueprintRequest(

        @Schema(description = "Secuencia ordenada de puntos que reemplaza la actual")
        @NotNull(message = "los puntos son obligatorios")
        @Valid
        List<Point> points
) { }
