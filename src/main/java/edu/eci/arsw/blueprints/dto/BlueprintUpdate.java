package edu.eci.arsw.blueprints.dto;

import edu.eci.arsw.blueprints.model.Point;

import java.util.List;

public record BlueprintUpdate(String author, String name, List<Point> points) {
}
