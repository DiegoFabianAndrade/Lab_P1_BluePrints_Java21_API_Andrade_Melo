import { useEffect, useRef, useState } from 'react'
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
  receiveRealtimeUpdate,
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
import { createSocket } from '../lib/socketIoClient.js'
import { createStompClient, subscribeBlueprint } from '../lib/stompClient.js'
import { USE_MOCK } from '../services/blueprintsService.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'
const STOMP_BASE = import.meta.env.VITE_STOMP_BASE ?? API_BASE
const IO_BASE = import.meta.env.VITE_IO_BASE ?? 'http://localhost:3001'

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
  const [tech, setTech] = useState('stomp')
  const [rtStatus, setRtStatus] = useState('disconnected')

  const stompRef = useRef(null)
  const socketRef = useRef(null)
  const unsubRef = useRef(null)

  useEffect(() => {
    dispatch(fetchAll())
  }, [dispatch])

  // Gestion del ciclo de vida de la conexion de tiempo real (STOMP / Socket.IO)
  useEffect(() => {
    unsubRef.current?.()
    unsubRef.current = null

    if (stompRef.current) {
      try {
        stompRef.current.deactivate()
      } catch (e) {
        console.error('Error closing STOMP connection', e)
      }
      stompRef.current = null
    }

    if (socketRef.current) {
      try {
        socketRef.current.disconnect()
      } catch (e) {
        console.error('Error closing Socket.IO connection', e)
      }
      socketRef.current = null
    }

    if (!current || tech === 'none') {
      setRtStatus('disconnected')
      return
    }

    if (tech === 'stomp') {
      setRtStatus('connecting')
      const client = createStompClient(STOMP_BASE)
      stompRef.current = client

      client.onConnect = () => {
        setRtStatus('connected')
        unsubRef.current = subscribeBlueprint(client, current.author, current.name, (upd) => {
          if (upd?.points) {
            dispatch(
              receiveRealtimeUpdate({
                author: current.author,
                name: current.name,
                points: upd.points,
              }),
            )
          }
        })
      }

      client.onStompError = () => setRtStatus('error')
      client.onWebSocketClose = () => setRtStatus('disconnected')

      client.activate()
    } else if (tech === 'socketio') {
      setRtStatus('connecting')
      const socket = createSocket(IO_BASE)
      socketRef.current = socket

      socket.on('connect', () => {
        setRtStatus('connected')
        const room = `blueprints.${current.author}.${current.name}`
        socket.emit('join-room', room)
      })

      socket.on('blueprint-update', (upd) => {
        if (upd?.points) {
          dispatch(
            receiveRealtimeUpdate({
              author: current.author,
              name: current.name,
              points: upd.points,
            }),
          )
        }
      })

      socket.on('connect_error', () => setRtStatus('error'))
      socket.on('disconnect', () => setRtStatus('disconnected'))
    }

    return () => {
      unsubRef.current?.()
      unsubRef.current = null
      stompRef.current?.deactivate()
      stompRef.current = null
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [tech, current?.author, current?.name, dispatch])

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
    if (tech === 'stomp' && stompRef.current?.connected && current) {
      stompRef.current.publish({
        destination: '/app/draw',
        body: JSON.stringify({ author: current.author, name: current.name, point }),
      })
      dispatch(
        receiveRealtimeUpdate({
          author: current.author,
          name: current.name,
          points: [point],
        }),
      )
    } else if (tech === 'socketio' && socketRef.current?.connected && current) {
      const room = `blueprints.${current.author}.${current.name}`
      socketRef.current.emit('draw-event', {
        room,
        author: current.author,
        name: current.name,
        point,
      })
      dispatch(
        receiveRealtimeUpdate({
          author: current.author,
          name: current.name,
          points: [point],
        }),
      )
    } else {
      dispatch(addDraftPoint(point))
    }
  }

  /** Guarda el borrador manual en caso de modo desconectado. */
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
          current
            ? () => dispatch(fetchBlueprint({ author: current.author, name: current.name }))
            : undefined
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

            <div className="row wrap" style={{ alignItems: 'center', marginBottom: 12, gap: 10 }}>
              <label htmlFor="rt-tech-select" style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
                Tiempo Real:
              </label>
              <select
                id="rt-tech-select"
                className="input"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                value={tech}
                onChange={(e) => setTech(e.target.value)}
              >
                <option value="stomp">STOMP (Spring WebSocket)</option>
                <option value="socketio">Socket.IO (Node.js)</option>
                <option value="none">Desactivado (Manual)</option>
              </select>

              {tech !== 'none' && current && (
                <span className={`badge ${rtStatus}`}>
                  {rtStatus === 'connected' && `Conectado (${tech === 'stomp' ? `/topic/blueprints.${current.author}.${current.name}` : `sala ${current.author}.${current.name}`})`}
                  {rtStatus === 'connecting' && 'Conectando...'}
                  {rtStatus === 'disconnected' && 'Desconectado'}
                  {rtStatus === 'error' && 'Error de conexion'}
                </span>
              )}
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

              {tech === 'none' && (
                <>
                  <button
                    className="btn primary"
                    onClick={saveDraft}
                    disabled={!draftPoints.length || loading.mutation === 'loading'}
                  >
                    {loading.mutation === 'loading'
                      ? 'Guardando...'
                      : `Guardar (${draftPoints.length})`}
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => dispatch(clearDraftPoints())}
                    disabled={!draftPoints.length}
                  >
                    Descartar
                  </button>
                </>
              )}
            </div>

            {current && (
              <p className="muted" style={{ marginTop: 8 }}>
                Puntos guardados: {current.points?.length || 0}
                {tech === 'none' && draftPoints.length ? ` + ${draftPoints.length} sin guardar` : ''}
                {tech !== 'none' && ' (colaboracion en tiempo real activa)'}
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
