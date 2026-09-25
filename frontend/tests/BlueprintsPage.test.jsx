import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import BlueprintsPage from '../src/pages/BlueprintsPage.jsx'
import { makeStore } from '../src/store/index.js'
import { fetchByAuthor } from '../src/features/blueprints/blueprintsSlice.js'

// Se reemplaza el servicio por un doble en memoria: la pagina no necesita backend
// y las pruebas no dependen de la red ni del valor de VITE_USE_MOCK.
vi.mock('../src/services/blueprintsService.js', () => {
  const data = {
    john: [
      {
        author: 'john',
        name: 'house',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      },
      { author: 'john', name: 'garage', points: [{ x: 5, y: 5 }] },
    ],
  }
  return {
    USE_MOCK: false,
    default: {
      name: 'fake',
      getAll: vi.fn(async () => Object.values(data).flat()),
      getByAuthor: vi.fn(async (author) => data[author] || []),
      getByAuthorAndName: vi.fn(async (author, name) =>
        (data[author] || []).find((bp) => bp.name === name),
      ),
      create: vi.fn(async (bp) => bp),
      addPoint: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      login: vi.fn(),
    },
  }
})

// La pagina lanza fetchAll al montarse; se espera a que termine para que el
// estado no cambie fuera de act() despues de cada prueba.
async function renderPage(preloaded) {
  const store = makeStore(preloaded)
  const utils = render(
    <Provider store={store}>
      <MemoryRouter>
        <BlueprintsPage />
      </MemoryRouter>
    </Provider>,
  )
  await waitFor(() => expect(store.getState().blueprints.loading.all).toBe('succeeded'))
  return { store, ...utils }
}

describe('BlueprintsPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renderiza el lienzo y el campo del plano actual vacio', async () => {
    await renderPage()
    expect(screen.getByTestId('blueprint-canvas')).toBeInTheDocument()
    expect(screen.getByLabelText(/Current blueprint/i)).toHaveValue('')
  })

  it('despacha fetchByAuthor al hacer click en Get blueprints', async () => {
    const { store } = await renderPage()
    const spy = vi.spyOn(store, 'dispatch')

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'john' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))

    const dispatched = spy.mock.calls.map(([action]) => action)
    expect(
      dispatched.some((a) => a?.type === 'blueprints/selectAuthor' && a.payload === 'john'),
    ).toBe(true)
    // El thunk se despacha como funcion; su efecto visible es la fila en la tabla.
    await waitFor(() => expect(screen.getByText('house')).toBeInTheDocument())
    expect(store.getState().blueprints.loading.byAuthor).toBe('succeeded')
  })

  it('muestra la tabla con nombre, numero de puntos y boton Open', async () => {
    await renderPage()

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'john' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))

    await waitFor(() => expect(screen.getByText("john's blueprints:")).toBeInTheDocument())
    expect(screen.getByText('Blueprint name')).toBeInTheDocument()
    expect(screen.getByText('Number of points')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Open' })).toHaveLength(2)
    expect(screen.getByText(/Total user points: 3/)).toBeInTheDocument()
  })

  it('al pulsar Open el nombre del plano llega al DOM desde Redux', async () => {
    const { store } = await renderPage()

    fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: 'john' } })
    fireEvent.click(screen.getByText(/Get blueprints/i))
    await waitFor(() => expect(screen.getByText('garage')).toBeInTheDocument())

    const openButtons = screen.getAllByRole('button', { name: 'Open' })
    fireEvent.click(openButtons[1])

    await waitFor(() => expect(screen.getByLabelText(/Current blueprint/i)).toHaveValue('garage'))
    expect(store.getState().blueprints.current.name).toBe('garage')
  })

  it('no despacha nada si el autor esta vacio', async () => {
    const { store } = await renderPage()
    const spy = vi.spyOn(store, 'dispatch')
    fireEvent.click(screen.getByText(/Get blueprints/i))
    expect(spy).not.toHaveBeenCalled()
  })

  it('muestra un banner con Reintentar cuando la consulta falla', async () => {
    await renderPage({
      blueprints: {
        all: [],
        byAuthor: {},
        selectedAuthor: 'john',
        current: null,
        draftPoints: [],
        pendingDelete: null,
        loading: { all: 'idle', byAuthor: 'failed', current: 'idle', mutation: 'idle' },
        error: { all: null, byAuthor: 'Recurso no encontrado', current: null, mutation: null },
      },
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Recurso no encontrado')
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument()
  })

  it('el thunk fetchByAuthor expone el tipo esperado', () => {
    expect(fetchByAuthor.pending.type).toBe('blueprints/fetchByAuthor/pending')
  })
})
