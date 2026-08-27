-- Datos de ejemplo, identicos a los del repositorio en memoria, para que la API
-- responda lo mismo con cualquiera de las dos implementaciones de persistencia.
--
-- ON CONFLICT DO NOTHING hace la carga idempotente: reiniciar la aplicacion no
-- duplica ni falla.

INSERT INTO blueprints (author, name) VALUES
    ('john', 'house'),
    ('john', 'garage'),
    ('jane', 'garden')
ON CONFLICT DO NOTHING;

INSERT INTO blueprint_points (author, name, point_index, x, y) VALUES
    ('john', 'house',  0,  0,  0),
    ('john', 'house',  1, 10,  0),
    ('john', 'house',  2, 10, 10),
    ('john', 'house',  3,  0, 10),
    ('john', 'garage', 0,  5,  5),
    ('john', 'garage', 1, 15,  5),
    ('john', 'garage', 2, 15, 15),
    ('jane', 'garden', 0,  2,  2),
    ('jane', 'garden', 1,  3,  4),
    ('jane', 'garden', 2,  6,  7)
ON CONFLICT DO NOTHING;
