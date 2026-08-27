CREATE TABLE IF NOT EXISTS blueprints (
    author VARCHAR(120) NOT NULL,
    name   VARCHAR(120) NOT NULL,
    CONSTRAINT pk_blueprints PRIMARY KEY (author, name)
);

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
