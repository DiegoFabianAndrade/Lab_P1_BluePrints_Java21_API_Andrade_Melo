package edu.eci.arsw.blueprints.controllers;

import edu.eci.arsw.blueprints.dto.BlueprintUpdate;
import edu.eci.arsw.blueprints.dto.DrawEvent;
import edu.eci.arsw.blueprints.model.Blueprint;
import edu.eci.arsw.blueprints.model.Point;
import edu.eci.arsw.blueprints.services.BlueprintsServices;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BlueprintRTControllerTest {

    @Mock
    private SimpMessagingTemplate template;

    @Mock
    private BlueprintsServices services;

    private BlueprintRTController controller;

    @BeforeEach
    void setUp() {
        controller = new BlueprintRTController(template, services);
    }

    @Test
    void shouldHandleDrawEventAndBroadcastUpdate() throws Exception {
        DrawEvent event = new DrawEvent("pedro", "casa-1", new Point(100, 200));

        controller.onDraw(event);

        verify(services).addPoint("pedro", "casa-1", 100, 200);

        ArgumentCaptor<BlueprintUpdate> captor = ArgumentCaptor.forClass(BlueprintUpdate.class);
        verify(template).convertAndSend(eq("/topic/blueprints.pedro.casa-1"), captor.capture());

        BlueprintUpdate sent = captor.getValue();
        assertNotNull(sent);
        assertEquals("pedro", sent.author());
        assertEquals("casa-1", sent.name());
        assertEquals(1, sent.points().size());
        assertEquals(new Point(100, 200), sent.points().get(0));
    }

    @Test
    void shouldCreateBlueprintWhenNotFoundAndBroadcast() throws Exception {
        DrawEvent event = new DrawEvent("nuevoAutor", "plano-nuevo", new Point(50, 75));
        doThrow(new edu.eci.arsw.blueprints.persistence.BlueprintNotFoundException("Not found"))
                .when(services).addPoint("nuevoAutor", "plano-nuevo", 50, 75);

        controller.onDraw(event);

        verify(services).addNewBlueprint(any(Blueprint.class));
        verify(template).convertAndSend(eq("/topic/blueprints.nuevoAutor.plano-nuevo"), any(BlueprintUpdate.class));
    }

    @Test
    void shouldIgnoreNullEventGracefully() {
        controller.onDraw(null);
        verifyNoInteractions(services);
        verifyNoInteractions(template);
    }

    @Test
    void shouldIgnoreIncompleteEventGracefully() {
        controller.onDraw(new DrawEvent(null, "plano", new Point(1, 1)));
        controller.onDraw(new DrawEvent("autor", null, new Point(1, 1)));
        controller.onDraw(new DrawEvent("autor", "plano", null));

        verifyNoInteractions(services);
        verifyNoInteractions(template);
    }
}
