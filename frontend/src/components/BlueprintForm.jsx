import { useState } from 'react'

const DEFAULT_POINTS = '[{"x":10,"y":10},{"x":40,"y":60}]'

/**
 * Formulario de creacion de planos.
 *
 * Los puntos se escriben como JSON para no inventar un editor de coordenadas:
 * el dibujo a mano alzada se hace directamente en el lienzo.
 */
export default function BlueprintForm({ onSubmit, disabled, initialPoints }) {
  const [author, setAuthor] = useState('')
  const [name, setName] = useState('')
  const [pointsJSON, setPointsJSON] = useState(
    initialPoints ? JSON.stringify(initialPoints) : DEFAULT_POINTS,
  )
  const [error, setError] = useState(null)

  const handleSubmit = (event) => {
    event.preventDefault()
    setError(null)

    if (!author.trim() || !name.trim()) {
      setError('El autor y el nombre son obligatorios')
      return
    }

    let points
    try {
      points = JSON.parse(pointsJSON)
    } catch {
      setError('El JSON de puntos no es valido')
      return
    }

    const valid =
      Array.isArray(points) &&
      points.every((p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)))
    if (!valid) {
      setError('Los puntos deben ser una lista de objetos con x e y numericos')
      return
    }

    onSubmit({
      author: author.trim(),
      name: name.trim(),
      points: points.map((p) => ({ x: Number(p.x), y: Number(p.y) })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3>Crear Blueprint</h3>
      <div className="grid cols-2">
        <div>
          <label htmlFor="bp-author">Autor</label>
          <input
            id="bp-author"
            className="input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="juan.perez"
          />
        </div>
        <div>
          <label htmlFor="bp-name">Nombre</label>
          <input
            id="bp-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mi-dibujo"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="bp-points">Puntos (JSON)</label>
        <textarea
          id="bp-points"
          className="input"
          rows="4"
          value={pointsJSON}
          onChange={(e) => setPointsJSON(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <div className="field">
        <button className="btn primary" type="submit" disabled={disabled}>
          Guardar
        </button>
      </div>
    </form>
  )
}
