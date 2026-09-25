import { describe, it, expect } from 'vitest'
import reducer, {
  addDraftPoint,
  clearDraftPoints,
  closeBlueprint,
  deleteBlueprint,
  fetchByAuthor,
  openBlueprint,
  selectAuthor,
  selectAuthors,
  selectCurrentName,
  selectTopFiveByPoints,
  selectTotalPoints,
} from '../src/features/blueprints/blueprintsSlice.js'

const house = {
  author: 'john',
  name: 'house',
  points: [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
  ],
}
const garage = { author: 'john', name: 'garage', points: [{ x: 3, y: 3 }] }

const initial = () => reducer(undefined, { type: '@@INIT' })

describe('blueprints slice: reducers puros', () => {
  it('arranca con el estado vacio y sin errores', () => {
    const state = initial()
    expect(state.all).toEqual([])
    expect(state.current).toBeNull()
    expect(state.draftPoints).toEqual([])
    expect(state.loading.all).toBe('idle')
    expect(state.error.all).toBeNull()
  })

  it('abre y cierra un plano', () => {
    let state = reducer(initial(), openBlueprint(house))
    expect(state.current).toEqual(house)
    state = reducer(state, closeBlueprint())
    expect(state.current).toBeNull()
  })

  it('acumula y descarta puntos del borrador', () => {
    let state = reducer(initial(), addDraftPoint({ x: 5, y: 6 }))
    state = reducer(state, addDraftPoint({ x: 7, y: 8 }))
    expect(state.draftPoints).toHaveLength(2)
    state = reducer(state, clearDraftPoints())
    expect(state.draftPoints).toEqual([])
  })

  it('guarda los planos del autor consultado', () => {
    let state = reducer(initial(), selectAuthor('john'))
    state = reducer(state, {
      type: fetchByAuthor.fulfilled.type,
      payload: { author: 'john', items: [house, garage] },
    })
    expect(state.byAuthor.john).toHaveLength(2)
    expect(state.loading.byAuthor).toBe('succeeded')
  })

  it('marca el error del thunk que falla sin tocar los demas', () => {
    const state = reducer(initial(), {
      type: fetchByAuthor.rejected.type,
      payload: 'Recurso no encontrado',
    })
    expect(state.loading.byAuthor).toBe('failed')
    expect(state.error.byAuthor).toBe('Recurso no encontrado')
    expect(state.error.all).toBeNull()
  })
})

describe('blueprints slice: borrado optimista', () => {
  const populated = () => {
    let state = reducer(initial(), selectAuthor('john'))
    state = reducer(state, {
      type: fetchByAuthor.fulfilled.type,
      payload: { author: 'john', items: [house, garage] },
    })
    return reducer(state, openBlueprint(house))
  }

  it('quita el plano de inmediato al iniciar el borrado', () => {
    const state = reducer(populated(), {
      type: deleteBlueprint.pending.type,
      meta: { arg: { author: 'john', name: 'house' } },
    })
    expect(state.byAuthor.john.map((bp) => bp.name)).toEqual(['garage'])
    expect(state.current).toBeNull()
  })

  it('revierte el borrado cuando el servidor lo rechaza', () => {
    let state = reducer(populated(), {
      type: deleteBlueprint.pending.type,
      meta: { arg: { author: 'john', name: 'house' } },
    })
    state = reducer(state, {
      type: deleteBlueprint.rejected.type,
      payload: 'No tienes permisos suficientes para esta operacion',
    })
    expect(state.byAuthor.john.map((bp) => bp.name).sort()).toEqual(['garage', 'house'])
    expect(state.current).toEqual(house)
    expect(state.error.mutation).toBe('No tienes permisos suficientes para esta operacion')
  })

  it('confirma el borrado cuando el servidor responde bien', () => {
    let state = reducer(populated(), {
      type: deleteBlueprint.pending.type,
      meta: { arg: { author: 'john', name: 'house' } },
    })
    state = reducer(state, {
      type: deleteBlueprint.fulfilled.type,
      payload: { author: 'john', name: 'house' },
    })
    expect(state.byAuthor.john.map((bp) => bp.name)).toEqual(['garage'])
    expect(state.pendingDelete).toBeNull()
  })
})

describe('blueprints slice: selectores', () => {
  const state = {
    blueprints: {
      ...initial(),
      all: [
        house,
        garage,
        {
          author: 'jane',
          name: 'garden',
          points: [
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 3, y: 3 },
          ],
        },
      ],
      byAuthor: { john: [house, garage] },
      selectedAuthor: 'john',
      current: house,
    },
  }

  it('expone el nombre del plano abierto', () => {
    expect(selectCurrentName(state)).toBe('house')
    expect(selectCurrentName({ blueprints: { ...state.blueprints, current: null } })).toBe('')
  })

  it('suma los puntos del autor consultado', () => {
    expect(selectTotalPoints(state)).toBe(3)
  })

  it('deriva los autores del catalogo', () => {
    expect(selectAuthors(state)).toEqual(['jane', 'john'])
  })

  it('ordena el top 5 por cantidad de puntos', () => {
    const top = selectTopFiveByPoints(state)
    expect(top).toHaveLength(3)
    expect(top[0]).toEqual({ author: 'jane', name: 'garden', points: 3 })
    expect(top.at(-1).points).toBe(1)
  })

  it('memoiza el top 5 mientras el catalogo no cambie', () => {
    expect(selectTopFiveByPoints(state)).toBe(selectTopFiveByPoints(state))
  })
})
