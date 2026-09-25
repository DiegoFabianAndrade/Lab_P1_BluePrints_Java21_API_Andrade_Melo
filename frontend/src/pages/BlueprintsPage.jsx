import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import BlueprintTable from '../components/BlueprintTable.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import TopBlueprints from '../components/TopBlueprints.jsx'
import { selectIsAuthenticated } from '../features/auth/authSlice.js'
import {
  addDraftPoint,
  addPoint,
  clearDraftPoints,
  deleteBlueprint,
  fetchAll,
  fetchBlueprint,
  fetchByAuthor,
  selectAuthorBlueprints,
  selectCurrent,
  selectCurrentName,
  selectDraftPoints,
  selectErrors,
  selectLoading,
  selectSelectedAuthor,
  selectTotalPoints,
  selectAuthor as selectAuthorAction,
  updatePoints,
} from '../features/blueprints/blueprintsSlice.js'
import { USE_MOCK } from '../services/blueprintsService.js'

export default function BlueprintsPage() {
  const dispatch = useDispatch()

  const items = useSelector(selectAuthorBlueprints)
  const selectedAuthor = useSelector(selectSelectedAuthor)
  const current = useSelector(selectCurrent)
  const currentName = useSelector(selectCurrentName)
  const draftPoints = useSelector(selectDraftPoints)
  const totalPoints = useSelector(selectTotalPoints)
  const loading = useSelector(selectLoading)
  const errors = useSelector(selectErrors)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const [authorInput, setAuthorInput] = useState('')
  const [drawMode, setDrawMode] = useState(false)

  // Catalogo general: alimenta el top 5 y sirve para saber que autores existen.
  useEffect(() => {
    dispatch(fetchAll())
  }, [dispatch])

  const getBlueprints = () => {
    const author = authorInput.trim()
    if (!author) return
    dispatch(selectAuthorAction(author))
    dispatch(fetchByAuthor(author))
  }

  const openBlueprint = (bp) => {
    setDrawMode(false)
    dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))
  }

  const removeBlueprint = (bp) => {
    dispatch(deleteBlueprint({ author: bp.author, name: bp.name }))
  }

  const handleCanvasClick = (point) => {
    dispatch(addDraftPoint(point))
  }

  /** Guarda el borrador: un punto por peticion si hay uno, o el trazo completo. */
  const saveDraft = () => {
    if (!current || !draftPoints.length) return
    if (draftPoints.length === 1) {
      dispatch(addPoint({ author: current.author, name: current.name, point: draftPoints[0] }))
    } else {
      dispatch(
        updatePoints({
          author: current.author,
          name: current.name,
          points: [...current.points, ...draftPoints],
        }),
      )
    }
  }

  const canWrite = isAuthenticated || USE_MOCK

  return (
    <div className="page">
      <ErrorBanner message={errors.all} onRetry={() => dispatch(fetchAll())} />
      <ErrorBanner
        message={errors.byAuthor}
        onRetry={selectedAuthor ? () => dispatch(fetchByAuthor(selectedAuthor)) : undefined}
      />
      <ErrorBanner
        message={errors.current}
        onRetry={
          current ? () => dispatch(fetchBlueprint({ author: current.author, name: current.name })) : undefined
        }
      />
      <ErrorBanner message={errors.mutation} />

      <div className="layout">
        <section className="column">
          <div className="card">
            <h2>Blueprints</h2>
            <div className="row">
              <input
                className="input"
                placeholder="Author"
                aria-label="Author"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && getBlueprints()}
              />
              <button className="btn primary" onClick={getBlueprints}>
                Get blueprints
              </button>
            </div>
            <p className="muted source-note">
              Fuente de datos: <strong>{USE_MOCK ? 'apimock' : 'apiclient'}</strong>
            </p>
          </div>

          <div className="card">
            <h3>{selectedAuthor ? `${selectedAuthor}'s blueprints:` : 'Resultados'}</h3>
            {loading.byAuthor === 'loading' ? (
              <p className="muted">Cargando planos...</p>
            ) : (
              <BlueprintTable
                items={items}
                onOpen={openBlueprint}
                onDelete={canWrite ? removeBlueprint : undefined}
                currentName={currentName}
              />
            )}
            <p className="total">Total user points: {totalPoints}</p>
          </div>

          <TopBlueprints />
        </section>

        <section className="column">
          <div className="card">
            <div className="field">
              <label htmlFor="current-blueprint">Current blueprint</label>
              <input
                id="current-blueprint"
                className="input"
                readOnly
                value={currentName}
                placeholder="Ningun plano abierto"
              />
            </div>

            {loading.current === 'loading' && <p className="muted">Cargando plano...</p>}

            <BlueprintCanvas
              points={current?.points || []}
              draftPoints={draftPoints}
              onAddPoint={drawMode && current ? handleCanvasClick : undefined}
            />

            <div className="row wrap canvas-actions">
              <button
                className={drawMode ? 'btn primary' : 'btn'}
                onClick={() => setDrawMode((value) => !value)}
                disabled={!current || !canWrite}
              >
                {drawMode ? 'Dibujando: click en el lienzo' : 'Dibujar puntos'}
              </button>
              <button
                className="btn primary"
                onClick={saveDraft}
                disabled={!draftPoints.length || loading.mutation === 'loading'}
              >
                {loading.mutation === 'loading' ? 'Guardando...' : `Guardar (${draftPoints.length})`}
              </button>
              <button
                className="btn ghost"
                onClick={() => dispatch(clearDraftPoints())}
                disabled={!draftPoints.length}
              >
                Descartar
              </button>
            </div>

            {current && (
              <p className="muted">
                Puntos guardados: {current.points.length}
                {draftPoints.length ? ` + ${draftPoints.length} sin guardar` : ''}
              </p>
            )}
            {!canWrite && (
              <p className="muted">Inicia sesion para crear planos o agregar puntos.</p>
            )}
          </div>

          <div className="card">
            <h3>Crear un plano</h3>
            <p className="muted">
              El formulario vive en una ruta protegida: sin token la aplicacion redirige al login.
            </p>
            <Link className="btn primary" to="/blueprints/new">
              Nuevo blueprint
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
