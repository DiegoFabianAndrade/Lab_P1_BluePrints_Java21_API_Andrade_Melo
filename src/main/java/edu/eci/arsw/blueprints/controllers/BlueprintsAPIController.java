package edu.eci.arsw.blueprints.controllers;

import edu.eci.arsw.blueprints.dto.ApiResponse;
import edu.eci.arsw.blueprints.dto.NewBlueprintRequest;
import edu.eci.arsw.blueprints.model.Blueprint;
import edu.eci.arsw.blueprints.model.Point;
import edu.eci.arsw.blueprints.persistence.BlueprintNotFoundException;
import edu.eci.arsw.blueprints.persistence.BlueprintPersistenceException;
import edu.eci.arsw.blueprints.services.BlueprintsServices;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Set;

/**
 * API REST de planos.
 *
 * <p>La ruta base incluye la version ({@code /api/v1}): si en el futuro cambia el
 * contrato, puede publicarse {@code /api/v2} sin romper a los clientes existentes.</p>
 *
 * <p>El controlador no atrapa excepciones. Las deja propagarse hacia
 * {@link GlobalExceptionHandler}, que las traduce a codigos HTTP y al mismo sobre
 * {@link ApiResponse} que usan las respuestas exitosas. Asi la logica de cada
 * endpoint queda limpia y el manejo de errores vive en un solo lugar.</p>
 */
@RestController
@RequestMapping("/api/v1/blueprints")
@Tag(name = "Blueprints", description = "Consulta y gestion de planos")
public class BlueprintsAPIController {

    private final BlueprintsServices services;

    public BlueprintsAPIController(BlueprintsServices services) {
        this.services = services;
    }

    @Operation(summary = "Listar todos los planos",
               description = "Devuelve todos los planos registrados. Si hay un perfil de "
                           + "filtrado activo, los puntos vienen ya filtrados.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Consulta exitosa")
    @GetMapping
    public ResponseEntity<ApiResponse<Set<Blueprint>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(services.getAllBlueprints()));
    }

    @Operation(summary = "Listar los planos de un autor")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Consulta exitosa")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "El autor no tiene planos")
    @GetMapping("/{author}")
    public ResponseEntity<ApiResponse<Set<Blueprint>>> byAuthor(@PathVariable String author)
            throws BlueprintNotFoundException {
        return ResponseEntity.ok(ApiResponse.ok(services.getBlueprintsByAuthor(author)));
    }

    @Operation(summary = "Consultar un plano concreto")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Consulta exitosa")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "El plano no existe")
    @GetMapping("/{author}/{bpname}")
    public ResponseEntity<ApiResponse<Blueprint>> byAuthorAndName(@PathVariable String author,
                                                                  @PathVariable String bpname)
            throws BlueprintNotFoundException {
        return ResponseEntity.ok(ApiResponse.ok(services.getBlueprint(author, bpname)));
    }

    @Operation(summary = "Crear un plano nuevo")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Plano creado")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos invalidos")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Ya existe un plano con ese autor y nombre")
    @PostMapping
    public ResponseEntity<ApiResponse<Blueprint>> add(@Valid @RequestBody NewBlueprintRequest req)
            throws BlueprintPersistenceException {
        Blueprint bp = new Blueprint(req.author(), req.name(), req.points());
        services.addNewBlueprint(bp);
        // Cabecera Location con la URI del recurso recien creado, como marca la convencion REST.
        URI location = UriComponentsBuilder.fromPath("/api/v1/blueprints/{author}/{name}")
                .buildAndExpand(bp.getAuthor(), bp.getName())
                .toUri();
        return ResponseEntity.created(location).body(ApiResponse.created(bp));
    }

    @Operation(summary = "Agregar un punto a un plano",
               description = "Anade el punto al final de la secuencia existente.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "202", description = "Actualizacion aceptada")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "El plano no existe")
    @PutMapping("/{author}/{bpname}/points")
    public ResponseEntity<ApiResponse<Void>> addPoint(@PathVariable String author,
                                                      @PathVariable String bpname,
                                                      @RequestBody Point p)
            throws BlueprintNotFoundException {
        services.addPoint(author, bpname, p.x(), p.y());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.accepted(null));
    }
}
