package edu.eci.arsw.blueprints.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.eci.arsw.blueprints.dto.NewBlueprintRequest;
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
}
