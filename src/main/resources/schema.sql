-- Esquema de la base de datos de planos (blueprints).
--
-- Se ejecuta automaticamente al arrancar la aplicacion cuando la propiedad
-- spring.sql.init.mode=always esta activa, de modo que el evaluador solo necesita
-- una base de datos PostgreSQL vacia: la aplicacion crea sus propias tablas.
--
-- Todas las sentencias son idempotentes (IF NOT EXISTS) para que arrancar la
-- aplicacion varias veces no produzca errores.

CREATE TABLE IF NOT EXISTS blueprints (
    author VARCHAR(120) NOT NULL,
    name   VARCHAR(120) NOT NULL,
    CONSTRAINT pk_blueprints PRIMARY KEY (author, name)
);

-- Los puntos se guardan en su propia tabla porque un plano tiene muchos puntos.
-- point_index preserva el ORDEN en que fueron dibujados: es imprescindible, ya que
-- los filtros (redundancy / undersampling) dependen de la secuencia de los puntos.
CREATE TABLE IF NOT EXISTS blueprint_points (
    id          BIGSERIAL    NOT NULL,
    author      VARCHAR(120) NOT NULL,
    name        VARCHAR(120) NOT NULL,
    point_index INTEGER      NOT NULL,
    x           INTEGER      NOT NULL,
    y           INTEGER      NOT NULL,
    CONSTRAINT pk_blueprint_points PRIMARY KEY (id),
    CONSTRAINT fk_point_blueprint  FOREIGN KEY (author, name)
        REFERENCES blueprints (author, name) ON DELETE CASCADE,
    CONSTRAINT uq_point_position   UNIQUE (author, name, point_index)
);

CREATE INDEX IF NOT EXISTS idx_blueprints_author ON blueprints (author);
