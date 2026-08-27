package edu.eci.arsw.blueprints.persistence.impl;

import edu.eci.arsw.blueprints.model.Blueprint;
import edu.eci.arsw.blueprints.model.Point;
import edu.eci.arsw.blueprints.persistence.BlueprintNotFoundException;
import edu.eci.arsw.blueprints.persistence.BlueprintPersistence;
import edu.eci.arsw.blueprints.persistence.BlueprintPersistenceException;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Repository
@Profile("!inmemory")
public class PostgresBlueprintPersistence implements BlueprintPersistence {

    private final JdbcTemplate jdbc;

    public PostgresBlueprintPersistence(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public void saveBlueprint(Blueprint bp) throws BlueprintPersistenceException {
        if (exists(bp.getAuthor(), bp.getName())) {
            throw new BlueprintPersistenceException(
                    "Blueprint already exists: %s:%s".formatted(bp.getAuthor(), bp.getName()));
        }
        jdbc.update("INSERT INTO blueprints (author, name) VALUES (?, ?)",
                bp.getAuthor(), bp.getName());
        insertPoints(bp.getAuthor(), bp.getName(), bp.getPoints());
    }

    @Override
    public Blueprint getBlueprint(String author, String name) throws BlueprintNotFoundException {
        if (!exists(author, name)) {
            throw new BlueprintNotFoundException("Blueprint not found: %s/%s".formatted(author, name));
        }
        return new Blueprint(author, name, findPoints(author, name));
    }

    @Override
    public Set<Blueprint> getBlueprintsByAuthor(String author) throws BlueprintNotFoundException {
        List<String> names = jdbc.queryForList(
                "SELECT name FROM blueprints WHERE author = ? ORDER BY name",
                String.class, author);
        if (names.isEmpty()) {
            throw new BlueprintNotFoundException("No blueprints for author: " + author);
        }
        Set<Blueprint> result = new LinkedHashSet<>();
        for (String name : names) {
            result.add(new Blueprint(author, name, findPoints(author, name)));
        }
        return result;
    }

    @Override
    public Set<Blueprint> getAllBlueprints() {
        List<Blueprint> shells = jdbc.query(
                "SELECT author, name FROM blueprints ORDER BY author, name",
                (rs, rowNum) -> new Blueprint(rs.getString("author"), rs.getString("name"), List.of()));
        Set<Blueprint> result = new LinkedHashSet<>();
        for (Blueprint shell : shells) {
            result.add(new Blueprint(shell.getAuthor(), shell.getName(),
                    findPoints(shell.getAuthor(), shell.getName())));
        }
        return result;
    }

    @Override
    @Transactional
    public void addPoint(String author, String name, int x, int y) throws BlueprintNotFoundException {
        if (!exists(author, name)) {
            throw new BlueprintNotFoundException("Blueprint not found: %s/%s".formatted(author, name));
        }
        Integer nextIndex = jdbc.queryForObject(
                "SELECT COALESCE(MAX(point_index) + 1, 0) FROM blueprint_points WHERE author = ? AND name = ?",
                Integer.class, author, name);
        jdbc.update("INSERT INTO blueprint_points (author, name, point_index, x, y) VALUES (?, ?, ?, ?, ?)",
                author, name, nextIndex, x, y);
    }

    private boolean exists(String author, String name) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM blueprints WHERE author = ? AND name = ?",
                Integer.class, author, name);
        return count != null && count > 0;
    }

    private List<Point> findPoints(String author, String name) {
        return jdbc.query(
                "SELECT x, y FROM blueprint_points WHERE author = ? AND name = ? ORDER BY point_index",
                (rs, rowNum) -> new Point(rs.getInt("x"), rs.getInt("y")),
                author, name);
    }

    private void insertPoints(String author, String name, List<Point> points) {
        for (int i = 0; i < points.size(); i++) {
            Point p = points.get(i);
            jdbc.update("INSERT INTO blueprint_points (author, name, point_index, x, y) VALUES (?, ?, ?, ?, ?)",
                    author, name, i, p.x(), p.y());
        }
    }
}
