package edu.eci.arsw.blueprints;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifica que el contexto de Spring se construye correctamente.
 *
 * <p>Se ejecuta con el perfil {@code inmemory} para que la suite de pruebas no
 * dependa de un servidor PostgreSQL en ejecucion.</p>
 */
@SpringBootTest
@ActiveProfiles("inmemory")
class BlueprintsSmokeTest {
    @Test void contextLoads() {}
}
