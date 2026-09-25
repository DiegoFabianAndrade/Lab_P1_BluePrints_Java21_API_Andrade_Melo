package edu.eci.arsw.blueprints.persistence;

import edu.eci.arsw.blueprints.model.Blueprint;
import edu.eci.arsw.blueprints.model.Point;

import java.util.List;
import java.util.Set;

public interface BlueprintPersistence {

    void saveBlueprint(Blueprint bp) throws BlueprintPersistenceException;

    Blueprint getBlueprint(String author, String name) throws BlueprintNotFoundException;

    Set<Blueprint> getBlueprintsByAuthor(String author) throws BlueprintNotFoundException;

    Set<Blueprint> getAllBlueprints();

    void addPoint(String author, String name, int x, int y) throws BlueprintNotFoundException;

    /** Reemplaza por completo la secuencia de puntos de un plano existente. */
    void updatePoints(String author, String name, List<Point> points) throws BlueprintNotFoundException;

    /** Elimina un plano y todos sus puntos. */
    void deleteBlueprint(String author, String name) throws BlueprintNotFoundException;
}
