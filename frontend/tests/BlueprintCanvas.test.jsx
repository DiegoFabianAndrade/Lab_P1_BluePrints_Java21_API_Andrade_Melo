import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BlueprintCanvas, { CANVAS_ID } from '../src/components/BlueprintCanvas.jsx'

const points = [
  { x: 0, y: 0 },
  { x: 10, y: 10 },
  { x: 20, y: 0 },
]

describe('BlueprintCanvas', () => {
  it('renderiza el lienzo con su identificador y dimensiones', () => {
    render(<BlueprintCanvas points={points} />)
    const canvas = screen.getByTestId(CANVAS_ID)
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas).toHaveAttribute('width', '520')
    expect(canvas).toHaveAttribute('height', '360')
  })

  it('obtiene el contexto 2d para dibujar', () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    render(<BlueprintCanvas points={points} />)
    expect(spy).toHaveBeenCalledWith('2d')
    spy.mockRestore()
  })

  it('acepta un identificador propio', () => {
    render(<BlueprintCanvas id="otro-lienzo" points={points} />)
    expect(screen.getByTestId('otro-lienzo')).toBeInTheDocument()
  })

  it('no reacciona al click cuando no es interactivo', () => {
    const { container } = render(<BlueprintCanvas points={points} />)
    fireEvent.click(container.querySelector('canvas'), { clientX: 100, clientY: 100 })
    // Sin onAddPoint el componente no debe fallar ni emitir nada.
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('convierte un click en un punto del plano cuando es interactivo', () => {
    const onAddPoint = vi.fn()
    render(<BlueprintCanvas points={points} onAddPoint={onAddPoint} />)
    fireEvent.click(screen.getByTestId(CANVAS_ID), { clientX: 260, clientY: 180 })

    expect(onAddPoint).toHaveBeenCalledTimes(1)
    const point = onAddPoint.mock.calls[0][0]
    expect(Number.isInteger(point.x)).toBe(true)
    expect(Number.isInteger(point.y)).toBe(true)
    // El click en el centro cae dentro del rango de los puntos dibujados.
    expect(point.x).toBeGreaterThanOrEqual(0)
    expect(point.x).toBeLessThanOrEqual(20)
  })
})
