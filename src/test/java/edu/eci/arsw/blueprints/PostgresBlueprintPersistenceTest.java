package edu.eci.arsw.blueprints;

import edu.eci.arsw.blueprints.model.Blueprint;
import edu.eci.arsw.blueprints.model.Point;
import edu.eci.arsw.blueprints.persistence.BlueprintNotFoundException;
import edu.eci.arsw.blueprints.persistence.BlueprintPersistenceException;
import edu.eci.arsw.blueprints.persistence.impl.PostgresBlueprintPersistence;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Pruebas de integracion de la persistencia en PostgreSQL.
 *
 * <p>Necesitan una base de datos real en ejecucion. Para que {@code mvn clean install}
 * no falle en un equipo sin base de datos, la clase comprueba primero si el servidor
 * responde y, si no lo hace, JUnit marca las pruebas como omitidas en lugar de
 * darlas por fallidas. La comprobacion se ejecuta antes de construir el contexto de
 * Spring, de modo que tampoco se intenta arrancar la aplicacion.</p>
 *
 * <p>Para ejecutarlas, basta con levantar la base de datos antes:
 * {@code docker compose up -d}.</p>
 */
@SpringBootTest
@Transactional
@Tag("integration")
@EnabledIf("postgresDisponible")
class PostgresBlueprintPersistenceTest {

    /** Comprueba si hay un PostgreSQL escuchando en el host y puerto configurados. */
    static boolean postgresDisponible() {
        String host = System.getenv().getOrDefault("DB_HOST", "localhost");
        int port = Integer.parseInt(System.getenv().getOrDefault("DB_PORT", "5432"));
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 1500);
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    @Autowired
    private PostgresBlueprintPersistence persistence;

    @Test
    void shouldSaveAndRetrieveBlueprint() throws BlueprintPersistenceException, BlueprintNotFoundException {
        Point[] points = { new Point(10, 20), new Point(30, 40) };
        Blueprint bp = new Blueprint("architect_test", "bridge", List.of(points));

        persistence.saveBlueprint(bp);

        Blueprint retrieved = persistence.getBlueprint("architect_test", "bridge");
        assertNotNull(retrieved);
        assertEquals("architect_test", retrieved.getAuthor());
        assertEquals("bridge", retrieved.getName());
        assertEquals(2, retrieved.getPoints().size());
        assertEquals(10, retrieved.getPoints().get(0).x());
        assertEquals(20, retrieved.getPoints().get(0).y());
        assertEquals(30, retrieved.getPoints().get(1).x());
        assertEquals(40, retrieved.getPoints().get(1).y());
    }

    @Test
    void shouldThrowWhenSavingDuplicateBlueprint() throws BlueprintPersistenceException {
        Blueprint bp = new Blueprint("duplicate_author", "tower", List.of(new Point(1, 1)));
        persistence.saveBlueprint(bp);

        assertThrows(BlueprintPersistenceException.class, () -> {
            persistence.saveBlueprint(bp);
        });
    }

    @Test
    void shouldThrowWhenBlueprintNotFound() {
        assertThrows(BlueprintNotFoundException.class, () -> {
            persistence.getBlueprint("non_existent_author", "non_existent_name");
        });
    }

    @Test
    void shouldGetBlueprintsByAuthor() throws BlueprintNotFoundException {
        Set<Blueprint> blueprints = persistence.getBlueprintsByAuthor("john");
        assertNotNull(blueprints);
        assertFalse(blueprints.isEmpty());
        assertTrue(blueprints.stream().anyMatch(bp -> bp.getName().equals("house")));
    }

    @Test
    void shouldThrowWhenAuthorHasNoBlueprints() {
        assertThrows(BlueprintNotFoundException.class, () -> {
            persistence.getBlueprintsByAuthor("unknown_author");
        });
    }

    @Test
    void shouldGetAllBlueprints() {
        Set<Blueprint> all = persistence.getAllBlueprints();
        assertNotNull(all);
        assertFalse(all.isEmpty());
        assertTrue(all.stream().anyMatch(bp -> bp.getAuthor().equals("john") && bp.getName().equals("house")));
    }

    @Test
    void shouldAddPointToBlueprint() throws BlueprintNotFoundException {
        Blueprint bpBefore = persistence.getBlueprint("john", "garage");
        int originalSize = bpBefore.getPoints().size();

        persistence.addPoint("john", "garage", 99, 88);

        Blueprint bpAfter = persistence.getBlueprint("john", "garage");
        assertEquals(originalSize + 1, bpAfter.getPoints().size());
        Point lastPoint = bpAfter.getPoints().get(bpAfter.getPoints().size() - 1);
        assertEquals(99, lastPoint.x());
        assertEquals(88, lastPoint.y());
    }

    @Test
    void shouldThrowWhenAddingPointToNonExistentBlueprint() {
        assertThrows(BlueprintNotFoundException.class, () -> {
            persistence.addPoint("ghost_author", "ghost_name", 10, 20);
        });
    }
}
