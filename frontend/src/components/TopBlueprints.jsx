import { useSelector } from 'react-redux'
import { selectTopFiveByPoints } from '../features/blueprints/blueprintsSlice.js'

/**
 * Top 5 de planos por cantidad de puntos.
 *
 * El calculo vive en un selector memoizado, de modo que la lista solo se vuelve a
 * derivar cuando cambia el catalogo, no en cada render.
 */
export default function TopBlueprints() {
  const top = useSelector(selectTopFiveByPoints)

  if (!top.length) return null

  return (
    <div className="card">
      <h3>Top 5 por puntos</h3>
      <ol className="top-list">
        {top.map((bp) => (
          <li key={`${bp.author}/${bp.name}`}>
            <span>
              {bp.name} <span className="muted">({bp.author})</span>
            </span>
            <span className="badge">{bp.points}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
