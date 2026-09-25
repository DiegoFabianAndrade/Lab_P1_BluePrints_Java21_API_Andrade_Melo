import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BlueprintForm from '../src/components/BlueprintForm.jsx'

describe('BlueprintForm', () => {
  it('envia el formulario con los puntos parseados', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.change(screen.getByLabelText(/Puntos/i), {
      target: { value: '[{"x":1,"y":2},{"x":"3","y":"4"}]' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      author: 'john',
      name: 'house',
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ],
    })
  })

  it('no envia si faltan el autor o el nombre', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/obligatorios/i)
  })

  it('muestra un error cuando el JSON de puntos no es valido', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.change(screen.getByLabelText(/Puntos/i), { target: { value: '[{x:1' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/JSON/i)
  })

  it('rechaza puntos sin coordenadas numericas', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.change(screen.getByLabelText(/Puntos/i), {
      target: { value: '[{"x":"uno","y":2}]' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/numericos/i)
  })

  it('deshabilita el boton mientras se guarda', () => {
    render(<BlueprintForm onSubmit={vi.fn()} disabled />)
    expect(screen.getByRole('button', { name: /Guardar/i })).toBeDisabled()
  })
})
