package edu.eci.arsw.blueprints.services;

import edu.eci.arsw.blueprints.model.Blueprint;
import edu.eci.arsw.blueprints.model.Point;
import edu.eci.arsw.blueprints.persistence.BlueprintNotFoundException;
import edu.eci.arsw.blueprints.persistence.BlueprintPersistenceException;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BlueprintsServicesFilterTest {

    @Nested
    @SpringBootTest
    @ActiveProfiles({"inmemory", "redundancy"})
    class RedundancyProfileTest {

        @Autowired
        private BlueprintsServices services;

        @Test
        void shouldApplyRedundancyFilterOnQuery() throws BlueprintPersistenceException, BlueprintNotFoundException {
            List<Point> points = List.of(
                    new Point(1, 1),
                    new Point(1, 1),
                    new Point(2, 2),
                    new Point(3, 3),
                    new Point(3, 3)
            );
            services.addNewBlueprint(new Blueprint("red_author", "red_bp", points));

            Blueprint retrieved = services.getBlueprint("red_author", "red_bp");
            assertEquals(3, retrieved.getPoints().size());
            assertEquals(new Point(1, 1), retrieved.getPoints().get(0));
            assertEquals(new Point(2, 2), retrieved.getPoints().get(1));
            assertEquals(new Point(3, 3), retrieved.getPoints().get(2));
        }
    }

    @Nested
    @SpringBootTest
    @ActiveProfiles({"inmemory", "undersampling"})
    class UndersamplingProfileTest {

        @Autowired
        private BlueprintsServices services;

        @Test
        void shouldApplyUndersamplingFilterOnQuery() throws BlueprintPersistenceException, BlueprintNotFoundException {
            List<Point> points = List.of(
                    new Point(0, 0),
                    new Point(1, 1),
                    new Point(2, 2),
                    new Point(3, 3)
            );
            services.addNewBlueprint(new Blueprint("under_author", "under_bp", points));

            Blueprint retrieved = services.getBlueprint("under_author", "under_bp");
            assertEquals(2, retrieved.getPoints().size());
            assertEquals(new Point(0, 0), retrieved.getPoints().get(0));
            assertEquals(new Point(2, 2), retrieved.getPoints().get(1));
        }
    }

    @Nested
    @SpringBootTest
    @ActiveProfiles({"inmemory", "redundancy", "undersampling"})
    class CombinedFiltersProfileTest {

        @Autowired
        private BlueprintsServices services;

        @Test
        void shouldApplyBothFiltersInChain() throws BlueprintPersistenceException, BlueprintNotFoundException {
            // [ (1,1), (1,1), (2,2), (3,3), (3,3), (4,4) ]
            // Redundancy -> [ (1,1), (2,2), (3,3), (4,4) ]
            // Undersampling -> [ (1,1), (3,3) ]
            List<Point> points = List.of(
                    new Point(1, 1),
                    new Point(1, 1),
                    new Point(2, 2),
                    new Point(3, 3),
                    new Point(3, 3),
                    new Point(4, 4)
            );
            services.addNewBlueprint(new Blueprint("chain_author", "chain_bp", points));

            Blueprint retrieved = services.getBlueprint("chain_author", "chain_bp");
            assertEquals(2, retrieved.getPoints().size());
            assertEquals(new Point(1, 1), retrieved.getPoints().get(0));
            assertEquals(new Point(3, 3), retrieved.getPoints().get(1));
        }
    }
}
