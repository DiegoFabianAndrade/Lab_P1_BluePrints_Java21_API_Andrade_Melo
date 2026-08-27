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

/**
 * Logica de negocio de planos.
 *
 * <p>Recibe <b>todos</b> los filtros activos y los aplica encadenados, en el orden
 * declarado con {@code @Order}. Asi se pueden activar varios perfiles a la vez
 * (por ejemplo {@code --spring.profiles.active=redundancy,undersampling}) sin que
 * el contexto de Spring falle por beans duplicados.</p>
 *
 * <p>El filtrado se aplica a <b>todas</b> las consultas de lectura, no solo a la
 * consulta de un plano individual.</p>
 */
@Service
public class BlueprintsServices {

    private final BlueprintPersistence persistence;
    private final List<BlueprintsFilter> filters;

    public BlueprintsServices(BlueprintPersistence persistence, List<BlueprintsFilter> filters) {
        this.persistence = persistence;
        this.filters = filters;
    }

    /** Aplica en cadena todos los filtros activos sobre un plano. */
    private Blueprint filter(Blueprint bp) {
        Blueprint result = bp;
        for (BlueprintsFilter f : filters) {
            result = f.apply(result);
        }
        return result;
    }

    /** Aplica la cadena de filtros a cada plano del conjunto, preservando el orden. */
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
