package edu.eci.arsw.blueprints.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.eci.arsw.blueprints.dto.NewBlueprintRequest;
import edu.eci.arsw.blueprints.dto.UpdateBlueprintRequest;
import edu.eci.arsw.blueprints.model.Point;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.hasSize;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("inmemory")
class BlueprintsAPIControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final SimpleGrantedAuthority READ_SCOPE = new SimpleGrantedAuthority("SCOPE_blueprints.read");
    private static final SimpleGrantedAuthority WRITE_SCOPE = new SimpleGrantedAuthority("SCOPE_blueprints.write");

    @Test
    void shouldReturn401WhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/blueprints"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldGetAllBlueprintsWithReadScope() throws Exception {
        mockMvc.perform(get("/api/v1/blueprints").with(jwt().authorities(READ_SCOPE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("execute ok"))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void shouldGetBlueprintsByAuthorWithReadScope() throws Exception {
        mockMvc.perform(get("/api/v1/blueprints/john").with(jwt().authorities(READ_SCOPE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void shouldReturn404WhenAuthorNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/blueprints/non_existent_author").with(jwt().authorities(READ_SCOPE)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    void shouldGetBlueprintByAuthorAndNameWithReadScope() throws Exception {
        mockMvc.perform(get("/api/v1/blueprints/john/house").with(jwt().authorities(READ_SCOPE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.author").value("john"))
                .andExpect(jsonPath("$.data.name").value("house"));
    }

    @Test
    void shouldReturn404WhenBlueprintNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/blueprints/john/unknown_blueprint").with(jwt().authorities(READ_SCOPE)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    void shouldCreateBlueprintWithWriteScope() throws Exception {
        NewBlueprintRequest request =
                new NewBlueprintRequest("tester", "office",
                        List.of(new Point(10, 10), new Point(20, 20)));

        mockMvc.perform(post("/api/v1/blueprints")
                        .with(jwt().authorities(WRITE_SCOPE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.data.author").value("tester"))
                .andExpect(jsonPath("$.data.name").value("office"));
    }

    @Test
    void shouldReturn403WhenCreatingBlueprintWithReadOnlyScope() throws Exception {
        NewBlueprintRequest request =
                new NewBlueprintRequest("tester", "forbidden_office",
                        List.of(new Point(10, 10)));

        mockMvc.perform(post("/api/v1/blueprints")
                        .with(jwt().authorities(READ_SCOPE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn400WhenCreatingDuplicateBlueprint() throws Exception {
        NewBlueprintRequest request =
                new NewBlueprintRequest("john", "house",
                        List.of(new Point(0, 0)));

        mockMvc.perform(post("/api/v1/blueprints")
                        .with(jwt().authorities(WRITE_SCOPE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void shouldAddPointToBlueprintWithWriteScope() throws Exception {
        Point point = new Point(50, 60);

        mockMvc.perform(put("/api/v1/blueprints/john/house/points")
                        .with(jwt().authorities(WRITE_SCOPE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(point)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.code").value(202));
    }

    @Test
    void shouldReturn404WhenAddingPointToNonExistentBlueprint() throws Exception {
        Point point = new Point(50, 60);

        mockMvc.perform(put("/api/v1/blueprints/ghost/blueprint/points")
                        .with(jwt().authorities(WRITE_SCOPE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(point)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    // ---------- Parte 5: PUT y DELETE usados por el cliente React ----------

    @Test
    void shouldReplacePointsWithWriteScope() throws Exception {
        NewBlueprintRequest create = new NewBlueprintRequest("react", "replace_me",
                List.of(new Point(1, 1), new Point(2, 2)));
        mockMvc.perform(post("/api/v1/blueprints")
                        .with(jwt().authorities(WRITE_SCOPE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated());

        UpdateBlueprintRequest update = new UpdateBlueprintRequest(
                List.of(new Point(0, 0), new Point(10, 10), new Point(20, 0)));

        mockMvc.perform(put("/api/v1/blueprints/react/replace_me")
                        .with(jwt().authorities(WRITE_SCOPE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.code").value(202))
                .andExpect(jsonPath("$.data.points", hasSize(3)))
                .andExpect(jsonPath("$.data.points[2].x").value(20));
    }

    @Test
    void shouldReturn404WhenReplacingPointsOfUnknownBlueprint() throws Exception {
        UpdateBlueprintRequest update = new UpdateBlueprintRequest(List.of(new Point(0, 0)));

        mockMvc.perform(put("/api/v1/blueprints/ghost/nothing")
                        .with(jwt().authorities(WRITE_SCOPE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    void shouldReturn400WhenReplacingPointsWithoutBody() throws Exception {
        mockMvc.perform(put("/api/v1/blueprints/john/house")
                        .with(jwt().authorities(WRITE_SCOPE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void shouldReturn403WhenReplacingPointsWithReadOnlyScope() throws Exception {
        UpdateBlueprintRequest update = new UpdateBlueprintRequest(List.of(new Point(0, 0)));

        mockMvc.perform(put("/api/v1/blueprints/john/house")
                        .with(jwt().authorities(READ_SCOPE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldDeleteBlueprintWithWriteScope() throws Exception {
        NewBlueprintRequest create = new NewBlueprintRequest("react", "delete_me",
                List.of(new Point(1, 1)));
        mockMvc.perform(post("/api/v1/blueprints")
                        .with(jwt().authorities(WRITE_SCOPE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/v1/blueprints/react/delete_me")
                        .with(jwt().authorities(WRITE_SCOPE)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/blueprints/react/delete_me")
                        .with(jwt().authorities(READ_SCOPE)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn404WhenDeletingUnknownBlueprint() throws Exception {
        mockMvc.perform(delete("/api/v1/blueprints/ghost/nothing")
                        .with(jwt().authorities(WRITE_SCOPE)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    void shouldReturn403WhenDeletingWithReadOnlyScope() throws Exception {
        mockMvc.perform(delete("/api/v1/blueprints/john/house")
                        .with(jwt().authorities(READ_SCOPE)))
                .andExpect(status().isForbidden());
    }

    // ---------- Parte 5: CORS para el cliente React ----------

    @Test
    void shouldAnswerCorsPreflightForReactDevServer() throws Exception {
        mockMvc.perform(options("/api/v1/blueprints")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS"));
    }

    @Test
    void shouldRejectCorsPreflightFromUnknownOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/blueprints")
                        .header("Origin", "http://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
