package edu.eci.arsw.blueprints.filters;

import edu.eci.arsw.blueprints.model.Blueprint;
import edu.eci.arsw.blueprints.model.Point;
import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Undersampling: conserva 1 de cada 2 puntos (indices pares), reduciendo la densidad.
 * Perfil: "undersampling". Se aplica despues de la eliminacion de redundancia.
 */
@Component
@Profile("undersampling")
@Order(2)
public class UndersamplingFilter implements BlueprintsFilter {
    @Override
    public Blueprint apply(Blueprint bp) {
        List<Point> in = bp.getPoints();
        if (in.size() <= 2) return bp;
        List<Point> out = new ArrayList<>();
        for (int i = 0; i < in.size(); i++) {
            if (i % 2 == 0) out.add(in.get(i));
        }
        return new Blueprint(bp.getAuthor(), bp.getName(), out);
    }
}
