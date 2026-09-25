import { useCallback, useEffect, useMemo, useRef } from 'react'

export const CANVAS_ID = 'blueprint-canvas'

const PADDING = 24

/**
 * Calcula la transformacion que encuadra los puntos dentro del lienzo.
 *
 * Los planos de ejemplo del backend usan coordenadas muy pequenas (0 a 15), asi
 * que sin encuadre se dibujarian como una mancha en la esquina. La escala se
 * limita a 12x para que un plano de dos puntos no se deforme.
 */
function computeTransform(points, width, height) {
  if (!points.length) return { scale: 1, dx: 0, dy: 0 }

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const spanX = maxX - minX
  const spanY = maxY - minY
  const usableW = width - PADDING * 2
  const usableH = height - PADDING * 2

  const scale = Math.min(12, spanX > 0 ? usableW / spanX : 12, spanY > 0 ? usableH / spanY : 12)

  // Centra el dibujo dentro del area util.
  const dx = PADDING + (usableW - spanX * scale) / 2 - minX * scale
  const dy = PADDING + (usableH - spanY * scale) / 2 - minY * scale
  return { scale, dx, dy }
}

/**
 * Lienzo del plano.
 *
 * Dibuja los segmentos consecutivos y marca cada punto. Cuando recibe
 * `onAddPoint` se vuelve interactivo: cada click agrega un punto al borrador,
 * que se pinta en un color distinto hasta que se guarda.
 */
export default function BlueprintCanvas({
  points = [],
  draftPoints = [],
  onAddPoint,
  width = 520,
  height = 360,
  id = CANVAS_ID,
}) {
  const ref = useRef(null)

  // El encuadre depende solo de los puntos guardados: asi no salta mientras se dibuja.
  const transform = useMemo(() => computeTransform(points, width, height), [points, width, height])

  const toCanvas = useCallback(
    (p) => ({ x: p.x * transform.scale + transform.dx, y: p.y * transform.scale + transform.dy }),
    [transform],
  )

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, width, height)

    // Rejilla de referencia.
    ctx.strokeStyle = 'rgba(148,163,184,0.15)'
    ctx.lineWidth = 1
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y <= height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    const drawPolyline = (list, stroke, fill, dashed) => {
      if (!list.length) return
      const mapped = list.map(toCanvas)
      if (mapped.length > 1) {
        ctx.strokeStyle = stroke
        ctx.lineWidth = 2
        ctx.setLineDash(dashed ? [6, 4] : [])
        ctx.beginPath()
        ctx.moveTo(mapped[0].x, mapped[0].y)
        for (let i = 1; i < mapped.length; i++) ctx.lineTo(mapped[i].x, mapped[i].y)
        ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.fillStyle = fill
      for (const p of mapped) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    drawPolyline(points, '#93c5fd', '#fbbf24', false)
    // El borrador arranca en el ultimo punto guardado para que la linea sea continua.
    const draftPath =
      points.length && draftPoints.length
        ? [points[points.length - 1], ...draftPoints]
        : draftPoints
    drawPolyline(draftPath, '#34d399', '#34d399', true)
  }, [points, draftPoints, width, height, toCanvas])

  const handleClick = (event) => {
    if (!onAddPoint) return
    const canvas = ref.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    // El lienzo puede estar escalado por CSS: se normaliza a coordenadas internas.
    const ratioX = rect.width ? width / rect.width : 1
    const ratioY = rect.height ? height / rect.height : 1
    const cx = (event.clientX - rect.left) * ratioX
    const cy = (event.clientY - rect.top) * ratioY
    onAddPoint({
      x: Math.round((cx - transform.dx) / transform.scale),
      y: Math.round((cy - transform.dy) / transform.scale),
    })
  }

  return (
    <canvas
      id={id}
      data-testid={id}
      ref={ref}
      width={width}
      height={height}
      onClick={handleClick}
      aria-label="Lienzo del plano"
      className="canvas"
      style={{ cursor: onAddPoint ? 'crosshair' : 'default', maxWidth: width }}
    />
  )
}
