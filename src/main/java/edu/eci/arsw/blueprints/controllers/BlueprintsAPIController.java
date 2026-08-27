package edu.eci.arsw.blueprints.controllers;

import edu.eci.arsw.blueprints.dto.ApiResponse;
import edu.eci.arsw.blueprints.dto.NewBlueprintRequest;
import edu.eci.arsw.blueprints.model.Blueprint;
import edu.eci.arsw.blueprints.model.Point;
import edu.eci.arsw.blueprints.persistence.BlueprintNotFoundException;
import edu.eci.arsw.blueprints.persistence.BlueprintPersistenceException;
import edu.eci.arsw.blueprints.services.BlueprintsServices;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/v1/blueprints")
@Tag(name = "Blueprints", description = "API REST de gestion de planos arquitectonicos")
public class BlueprintsAPIController {

    private final BlueprintsServices services;

    public BlueprintsAPIController(BlueprintsServices services) {
        this.services = services;
    }

    @GetMapping
    @Operation(summary = "Obtener todos los planos", description = "Retorna el conjunto de todos los planos registrados")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Planos consultados exitosamente")
    })
    public ResponseEntity<ApiResponse<Set<Blueprint>>> getAll() {
        Set<Blueprint> blueprints = services.getAllBlueprints();
        return ResponseEntity.ok(ApiResponse.ok(blueprints));
    }

    @GetMapping("/{author}")
    @Operation(summary = "Obtener planos por autor", description = "Retorna todos los planos creados por un autor especifico")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Planos del autor encontrados"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Autor no encontrado")
    })
    public ResponseEntity<ApiResponse<Set<Blueprint>>> byAuthor(@PathVariable String author) throws BlueprintNotFoundException {
        Set<Blueprint> blueprints = services.getBlueprintsByAuthor(author);
        return ResponseEntity.ok(ApiResponse.ok(blueprints));
    }

    @GetMapping("/{author}/{bpname}")
    @Operation(summary = "Obtener un plano por autor y nombre", description = "Retorna un plano especifico con sus puntos")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Plano encontrado exitosamente"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Plano no encontrado")
    })
    public ResponseEntity<ApiResponse<Blueprint>> byAuthorAndName(@PathVariable String author, @PathVariable String bpname) throws BlueprintNotFoundException {
        Blueprint bp = services.getBlueprint(author, bpname);
        return ResponseEntity.ok(ApiResponse.ok(bp));
    }

    @PostMapping
    @Operation(summary = "Registrar un nuevo plano", description = "Crea un nuevo plano con sus puntos iniciales")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Plano creado exitosamente"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos invalidos o plano ya existente")
    })
    public ResponseEntity<ApiResponse<Blueprint>> add(@Valid @RequestBody NewBlueprintRequest req) throws BlueprintPersistenceException {
        Blueprint bp = new Blueprint(req.author(), req.name(), req.points());
        services.addNewBlueprint(bp);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(bp));
    }

    @PutMapping("/{author}/{bpname}/points")
    @Operation(summary = "Agregar un punto a un plano", description = "Agrega un nuevo punto al final de la secuencia de puntos del plano")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "202", description = "Punto agregado exitosamente"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Plano no encontrado")
    })
    public ResponseEntity<ApiResponse<Point>> addPoint(@PathVariable String author, @PathVariable String bpname,
                                                      @RequestBody Point p) throws BlueprintNotFoundException {
        services.addPoint(author, bpname, p.x(), p.y());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.accepted(p));
    }
}
