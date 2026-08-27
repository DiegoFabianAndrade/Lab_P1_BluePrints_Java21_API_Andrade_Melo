package edu.eci.arsw.blueprints.filters;

import edu.eci.arsw.blueprints.model.Blueprint;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Filtro neutro: devuelve el plano sin modificar.
 *
 * <p>Siempre esta registrado y es el primero de la cadena. Cuando no hay ningun
 * perfil de filtrado activo es el unico eslabon, de modo que la API responde con
 * los puntos originales.</p>
 */
@Component
@Order(0)
public class IdentityFilter implements BlueprintsFilter {
    @Override
    public Blueprint apply(Blueprint bp) { return bp; }
}
