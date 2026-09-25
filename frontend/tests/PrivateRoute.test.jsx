import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PrivateRoute from '../src/components/PrivateRoute.jsx'
import { makeStore } from '../src/store/index.js'

function renderAt(path, preloaded) {
  const store = makeStore(preloaded)
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>Pantalla de login</p>} />
          <Route
            path="/privado"
            element={
              <PrivateRoute>
                <p>Contenido protegido</p>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => localStorage.clear())

  it('redirige al login cuando no hay token', () => {
    renderAt('/privado')
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('muestra el contenido cuando hay sesion', () => {
    renderAt('/privado', {
      auth: { token: 'jwt', username: 'student', status: 'succeeded', error: null },
    })
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })
})
