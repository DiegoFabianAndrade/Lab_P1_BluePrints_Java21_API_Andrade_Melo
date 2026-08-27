package edu.eci.arsw.blueprints.services;

import edu.eci.arsw.blueprints.filters.BlueprintsFilter;
import edu.eci.arsw.blueprints.model.Blueprint;
import edu.eci.arsw.blueprints.persistence.BlueprintNotFoundException;
import edu.eci.arsw.blueprints.persistence.BlueprintPersistence;
import edu.eci.arsw.blueprints.persistence.BlueprintPersistenceException;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class BlueprintsServices {

    private final BlueprintPersistence persistence;
    private final List<BlueprintsFilter> filters;

    public BlueprintsServices(BlueprintPersistence persistence, List<BlueprintsFilter> filters) {
        this.persistence = persistence;
        this.filters = filters;
    }

    private Blueprint filter(Blueprint bp) {
        Blueprint result = bp;
        for (BlueprintsFilter f : filters) {
            result = f.apply(result);
        }
        return result;
    }

    private Set<Blueprint> filter(Set<Blueprint> bps) {
        Set<Blueprint> result = new LinkedHashSet<>();
        for (Blueprint bp : bps) {
            result.add(filter(bp));
        }
        return result;
    }

    public void addNewBlueprint(Blueprint bp) throws BlueprintPersistenceException {
        persistence.saveBlueprint(bp);
    }

    public Set<Blueprint> getAllBlueprints() {
        return filter(persistence.getAllBlueprints());
    }

    public Set<Blueprint> getBlueprintsByAuthor(String author) throws BlueprintNotFoundException {
        return filter(persistence.getBlueprintsByAuthor(author));
    }

    public Blueprint getBlueprint(String author, String name) throws BlueprintNotFoundException {
        return filter(persistence.getBlueprint(author, name));
    }

    public void addPoint(String author, String name, int x, int y) throws BlueprintNotFoundException {
        persistence.addPoint(author, name, x, y);
    }
}
