package edu.eci.arsw.blueprints.filters;

import edu.eci.arsw.blueprints.model.Blueprint;
import edu.eci.arsw.blueprints.model.Point;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FiltersTest {

    @Test
    void identityFilterShouldNotModifyBlueprint() {
        IdentityFilter filter = new IdentityFilter();
        List<Point> points = List.of(new Point(1, 1), new Point(1, 1), new Point(2, 2));
        Blueprint bp = new Blueprint("author", "plane", points);

        Blueprint result = filter.apply(bp);

        assertEquals(3, result.getPoints().size());
        assertEquals(points, result.getPoints());
    }

    @Test
    void redundancyFilterShouldRemoveConsecutiveDuplicates() {
        RedundancyFilter filter = new RedundancyFilter();
        List<Point> points = List.of(
                new Point(10, 10),
                new Point(10, 10),
                new Point(20, 20),
                new Point(20, 20),
                new Point(10, 10)
        );
        Blueprint bp = new Blueprint("author", "plane", points);

        Blueprint result = filter.apply(bp);

        assertEquals(3, result.getPoints().size());
        assertEquals(new Point(10, 10), result.getPoints().get(0));
        assertEquals(new Point(20, 20), result.getPoints().get(1));
        assertEquals(new Point(10, 10), result.getPoints().get(2));
    }

    @Test
    void redundancyFilterShouldHandleEmptyAndSinglePoint() {
        RedundancyFilter filter = new RedundancyFilter();

        Blueprint emptyBp = new Blueprint("author", "empty", List.of());
        assertEquals(0, filter.apply(emptyBp).getPoints().size());

        Blueprint singleBp = new Blueprint("author", "single", List.of(new Point(5, 5)));
        assertEquals(1, filter.apply(singleBp).getPoints().size());
    }

    @Test
    void undersamplingFilterShouldKeepOneOfEveryTwoPoints() {
        UndersamplingFilter filter = new UndersamplingFilter();
        List<Point> points = List.of(
                new Point(0, 0),
                new Point(1, 1),
                new Point(2, 2),
                new Point(3, 3),
                new Point(4, 4)
        );
        Blueprint bp = new Blueprint("author", "plane", points);

        Blueprint result = filter.apply(bp);

        assertEquals(3, result.getPoints().size());
        assertEquals(new Point(0, 0), result.getPoints().get(0));
        assertEquals(new Point(2, 2), result.getPoints().get(1));
        assertEquals(new Point(4, 4), result.getPoints().get(2));
    }

    @Test
    void undersamplingFilterShouldHandleEvenNumberOfPoints() {
        UndersamplingFilter filter = new UndersamplingFilter();
        List<Point> points = List.of(
                new Point(10, 10),
                new Point(20, 20),
                new Point(30, 30),
                new Point(40, 40)
        );
        Blueprint bp = new Blueprint("author", "plane", points);

        Blueprint result = filter.apply(bp);

        assertEquals(2, result.getPoints().size());
        assertEquals(new Point(10, 10), result.getPoints().get(0));
        assertEquals(new Point(30, 30), result.getPoints().get(1));
    }

    @Test
    void undersamplingFilterShouldHandleEmptyAndSinglePoint() {
        UndersamplingFilter filter = new UndersamplingFilter();

        Blueprint emptyBp = new Blueprint("author", "empty", List.of());
        assertEquals(0, filter.apply(emptyBp).getPoints().size());

        Blueprint singleBp = new Blueprint("author", "single", List.of(new Point(5, 5)));
        assertEquals(1, filter.apply(singleBp).getPoints().size());
    }
}
