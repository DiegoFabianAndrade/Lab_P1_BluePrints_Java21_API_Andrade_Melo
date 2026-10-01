package edu.eci.arsw.blueprints.controllers;

import edu.eci.arsw.blueprints.dto.BlueprintUpdate;
import edu.eci.arsw.blueprints.dto.DrawEvent;
import edu.eci.arsw.blueprints.model.Blueprint;
import edu.eci.arsw.blueprints.persistence.BlueprintNotFoundException;
import edu.eci.arsw.blueprints.persistence.BlueprintPersistenceException;
import edu.eci.arsw.blueprints.services.BlueprintsServices;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class BlueprintRTController {

    private final SimpMessagingTemplate template;
    private final BlueprintsServices services;

    public BlueprintRTController(SimpMessagingTemplate template, BlueprintsServices services) {
        this.template = template;
        this.services = services;
    }

    @MessageMapping("/draw")
    public void onDraw(DrawEvent evt) {
        if (evt == null || evt.author() == null || evt.name() == null || evt.point() == null) {
            return;
        }

        try {
            services.addPoint(evt.author(), evt.name(), evt.point().x(), evt.point().y());
        } catch (BlueprintNotFoundException e) {
            try {
                services.addNewBlueprint(new Blueprint(evt.author(), evt.name(), List.of(evt.point())));
            } catch (BlueprintPersistenceException ignored) {
            }
        }

        BlueprintUpdate update = new BlueprintUpdate(evt.author(), evt.name(), List.of(evt.point()));
        template.convertAndSend("/topic/blueprints." + evt.author() + "." + evt.name(), update);
    }
}
