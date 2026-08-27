package edu.eci.arsw.blueprints.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.eci.arsw.blueprints.dto.NewBlueprintRequest;
import edu.eci.arsw.blueprints.model.Point;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de integracion de la capa web.
 *
 * <p>Se ejecutan con el perfil {@code inmemory} porque lo que se verifica aqui es el
 * contrato HTTP —rutas, codigos de estado y forma del sobre {@code ApiResponse}—, no
 * el acceso a datos. Eso permite que {@code mvn clean install} funcione en cualquier
 * equipo sin necesidad de levantar PostgreSQL; la persistencia real se prueba aparte
 * en {@code PostgresBlueprintPersistenceTest}.</p>
 *
 * <p>No se anota con {@code @Transactional}: en modo memoria no hay gestor de
 * transacciones y, sobre todo, no tendria efecto, porque no se puede revertir un
 * {@code HashMap}. Las comprobaciones estan escritas para no depender del estado
 * dejado por otras pruebas.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("inmemory")
class BlueprintsAPIControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldGetAllBlueprints() throws Exception {
        mockMvc.perform(get("/api/v1/blueprints"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("execute ok"))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void shouldGetBlueprintsByAuthor() throws Exception {
        mockMvc.perform(get("/api/v1/blueprints/john"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void shouldReturn404WhenAuthorNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/blueprints/non_existent_author"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    void shouldGetBlueprintByAuthorAndName() throws Exception {
        mockMvc.perform(get("/api/v1/blueprints/john/house"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.author").value("john"))
                .andExpect(jsonPath("$.data.name").value("house"));
    }

    @Test
    void shouldReturn404WhenBlueprintNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/blueprints/john/unknown_blueprint"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    void shouldCreateBlueprint() throws Exception {
        NewBlueprintRequest request =
                new NewBlueprintRequest("tester", "office",
                        List.of(new Point(10, 10), new Point(20, 20)));

        mockMvc.perform(post("/api/v1/blueprints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.data.author").value("tester"))
                .andExpect(jsonPath("$.data.name").value("office"));
    }

    /**
     * Crear un plano que ya existe se rechaza con 400 Bad Request, uno de los codigos
     * que enumera el enunciado del laboratorio. Lo importante es que ya no responde
     * 403 Forbidden como en el codigo base: 403 significa falta de permisos, que no es
     * lo que ocurre aqui.
     */
    @Test
    void shouldReturn400WhenCreatingDuplicateBlueprint() throws Exception {
        NewBlueprintRequest request =
                new NewBlueprintRequest("john", "house",
                        List.of(new Point(0, 0)));

        mockMvc.perform(post("/api/v1/blueprints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void shouldAddPointToBlueprint() throws Exception {
        Point point = new Point(50, 60);

        mockMvc.perform(put("/api/v1/blueprints/john/house/points")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(point)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.code").value(202));
    }

    @Test
    void shouldReturn404WhenAddingPointToNonExistentBlueprint() throws Exception {
        Point point = new Point(50, 60);

        mockMvc.perform(put("/api/v1/blueprints/ghost/blueprint/points")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(point)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }
}
