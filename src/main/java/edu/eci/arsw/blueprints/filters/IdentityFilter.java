package edu.eci.arsw.blueprints.filters;

import edu.eci.arsw.blueprints.model.Blueprint;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(0)
public class IdentityFilter implements BlueprintsFilter {

    @Override
    public Blueprint apply(Blueprint bp) {
        return bp;
    }
}
