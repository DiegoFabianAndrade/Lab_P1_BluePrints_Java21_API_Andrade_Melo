import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import {
  fetchBlueprint,
  selectCurrent,
  selectErrors,
  selectLoading,
} from '../features/blueprints/blueprintsSlice.js'

export default function BlueprintDetailPage() {
  const { author, name } = useParams()
  const dispatch = useDispatch()
  const blueprint = useSelector(selectCurrent)
  const loading = useSelector(selectLoading)
  const errors = useSelector(selectErrors)

  useEffect(() => {
    dispatch(fetchBlueprint({ author, name }))
  }, [author, name, dispatch])

  const retry = () => dispatch(fetchBlueprint({ author, name }))

  return (
    <div className="narrow">
      <ErrorBanner message={errors.current} onRetry={retry} />
      <div className="card">
        <h2>{name}</h2>
        <p>
          <strong>Autor:</strong> {author}
        </p>
        {loading.current === 'loading' && <p className="muted">Cargando plano...</p>}
        {blueprint && blueprint.name === name && (
          <>
            <p>
              <strong>Puntos:</strong> {blueprint.points.length}
            </p>
            <BlueprintCanvas id="blueprint-canvas-detail" points={blueprint.points} />
          </>
        )}
        <p className="field">
          <Link className="btn" to="/">
            Volver
          </Link>
        </p>
      </div>
    </div>
  )
}
