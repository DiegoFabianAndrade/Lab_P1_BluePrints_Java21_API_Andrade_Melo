import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import service from '../../services/blueprintsService.js'

/** Traduce cualquier error a un texto plano apto para el estado de Redux. */
const asMessage = (error) => error?.message || 'Error inesperado'

const withRejectValue = (fn) => async (arg, { rejectWithValue }) => {
  try {
    return await fn(arg)
  } catch (error) {
    return rejectWithValue(asMessage(error))
  }
}

export const fetchAll = createAsyncThunk(
  'blueprints/fetchAll',
  withRejectValue(() => service.getAll()),
)

export const fetchByAuthor = createAsyncThunk(
  'blueprints/fetchByAuthor',
  withRejectValue(async (author) => ({ author, items: await service.getByAuthor(author) })),
)

export const fetchBlueprint = createAsyncThunk(
  'blueprints/fetchBlueprint',
  withRejectValue(({ author, name }) => service.getByAuthorAndName(author, name)),
)

export const createBlueprint = createAsyncThunk(
  'blueprints/createBlueprint',
  withRejectValue((blueprint) => service.create(blueprint)),
)

export const addPoint = createAsyncThunk(
  'blueprints/addPoint',
  withRejectValue(({ author, name, point }) => service.addPoint(author, name, point)),
)

export const updatePoints = createAsyncThunk(
  'blueprints/updatePoints',
  withRejectValue(({ author, name, points }) => service.update(author, name, points)),
)

export const deleteBlueprint = createAsyncThunk(
  'blueprints/deleteBlueprint',
  withRejectValue(({ author, name }) => service.remove(author, name)),
)

const initialState = {
  all: [],
  byAuthor: {},
  selectedAuthor: '',
  /** Plano abierto en el lienzo; su nombre llega al DOM a traves de Redux. */
  current: null,
  /** Puntos que el usuario dibuja a mano antes de guardarlos. */
  draftPoints: [],
  /** Copia de seguridad para revertir un borrado optimista que falle. */
  pendingDelete: null,
  /** Estado por thunk: idle | loading | succeeded | failed. */
  loading: { all: 'idle', byAuthor: 'idle', current: 'idle', mutation: 'idle' },
  /** Error por thunk, en texto listo para mostrar. */
  error: { all: null, byAuthor: null, current: null, mutation: null },
}

/** Reemplaza un plano dentro de una lista, o lo agrega si aun no estaba. */
function upsert(list, blueprint) {
  const index = list.findIndex((bp) => bp.author === blueprint.author && bp.name === blueprint.name)
  if (index >= 0) list[index] = blueprint
  else list.push(blueprint)
}

function removeFrom(list, author, name) {
  const index = list.findIndex((bp) => bp.author === author && bp.name === name)
  if (index >= 0) list.splice(index, 1)
}

/** Identifica las acciones que corresponden a una mutacion (escritura). */
const isMutation = (type) =>
  type.includes('createBlueprint') ||
  type.includes('addPoint') ||
  type.includes('updatePoints') ||
  type.includes('deleteBlueprint')

const slice = createSlice({
  name: 'blueprints',
  initialState,
  reducers: {
    selectAuthor(state, action) {
      state.selectedAuthor = action.payload
    },
    /** Abre un plano ya cargado sin volver a pedirlo al servidor. */
    openBlueprint(state, action) {
      state.current = action.payload
      state.draftPoints = []
    },
    closeBlueprint(state) {
      state.current = null
      state.draftPoints = []
    },
    addDraftPoint(state, action) {
      state.draftPoints.push(action.payload)
    },
    clearDraftPoints(state) {
      state.draftPoints = []
    },
    clearErrors(state) {
      state.error = { all: null, byAuthor: null, current: null, mutation: null }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAll.pending, (s) => {
        s.loading.all = 'loading'
        s.error.all = null
      })
      .addCase(fetchAll.fulfilled, (s, a) => {
        s.loading.all = 'succeeded'
        s.all = a.payload
      })
      .addCase(fetchAll.rejected, (s, a) => {
        s.loading.all = 'failed'
        s.error.all = a.payload || asMessage(a.error)
      })

      .addCase(fetchByAuthor.pending, (s) => {
        s.loading.byAuthor = 'loading'
        s.error.byAuthor = null
      })
      .addCase(fetchByAuthor.fulfilled, (s, a) => {
        s.loading.byAuthor = 'succeeded'
        s.byAuthor[a.payload.author] = a.payload.items
      })
      .addCase(fetchByAuthor.rejected, (s, a) => {
        s.loading.byAuthor = 'failed'
        s.error.byAuthor = a.payload || asMessage(a.error)
      })

      .addCase(fetchBlueprint.pending, (s) => {
        s.loading.current = 'loading'
        s.error.current = null
      })
      .addCase(fetchBlueprint.fulfilled, (s, a) => {
        s.loading.current = 'succeeded'
        s.current = a.payload
        s.draftPoints = []
      })
      .addCase(fetchBlueprint.rejected, (s, a) => {
        s.loading.current = 'failed'
        s.error.current = a.payload || asMessage(a.error)
      })

      .addCase(createBlueprint.fulfilled, (s, a) => {
        const bp = a.payload
        upsert(s.all, bp)
        if (s.byAuthor[bp.author]) upsert(s.byAuthor[bp.author], bp)
        s.current = bp
        s.draftPoints = []
      })

      // Borrado optimista: la fila desaparece de inmediato y se guarda una copia
      // por si el servidor rechaza la operacion.
      .addCase(deleteBlueprint.pending, (s, a) => {
        const { author, name } = a.meta.arg
        const snapshot =
          s.all.find((bp) => bp.author === author && bp.name === name) ||
          (s.byAuthor[author] || []).find((bp) => bp.name === name) ||
          null
        s.pendingDelete = { author, name, snapshot, current: s.current }
        removeFrom(s.all, author, name)
        if (s.byAuthor[author]) removeFrom(s.byAuthor[author], author, name)
        if (s.current && s.current.author === author && s.current.name === name) {
          s.current = null
          s.draftPoints = []
        }
      })
      .addCase(deleteBlueprint.fulfilled, (s) => {
        s.pendingDelete = null
      })
      .addCase(deleteBlueprint.rejected, (s) => {
        // Revierte: el plano vuelve a la lista y se restaura el que estaba abierto.
        const backup = s.pendingDelete
        if (backup?.snapshot) {
          upsert(s.all, backup.snapshot)
          if (s.byAuthor[backup.author]) upsert(s.byAuthor[backup.author], backup.snapshot)
        }
        if (backup?.current) s.current = backup.current
        s.pendingDelete = null
      })

      // addPoint y updatePoints devuelven el plano completo ya actualizado.
      .addMatcher(
        (action) => [addPoint.fulfilled.type, updatePoints.fulfilled.type].includes(action.type),
        (s, a) => {
          const bp = a.payload
          upsert(s.all, bp)
          if (s.byAuthor[bp.author]) upsert(s.byAuthor[bp.author], bp)
          s.current = bp
          s.draftPoints = []
        },
      )

      // Estado comun de carga y error para todas las mutaciones.
      .addMatcher(
        (action) => action.type.endsWith('/pending') && isMutation(action.type),
        (s) => {
          s.loading.mutation = 'loading'
          s.error.mutation = null
        },
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled') && isMutation(action.type),
        (s) => {
          s.loading.mutation = 'succeeded'
        },
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected') && isMutation(action.type),
        (s, a) => {
          s.loading.mutation = 'failed'
          s.error.mutation = a.payload || asMessage(a.error)
        },
      )
  },
})

export const {
  selectAuthor,
  openBlueprint,
  closeBlueprint,
  addDraftPoint,
  clearDraftPoints,
  clearErrors,
} = slice.actions

// ---------------------------------------------------------------------------
// Selectores
// ---------------------------------------------------------------------------

export const selectAllBlueprints = (state) => state.blueprints.all
export const selectSelectedAuthor = (state) => state.blueprints.selectedAuthor
export const selectCurrent = (state) => state.blueprints.current
export const selectDraftPoints = (state) => state.blueprints.draftPoints
export const selectLoading = (state) => state.blueprints.loading
export const selectErrors = (state) => state.blueprints.error

/** Nombre del plano abierto, expuesto al DOM desde el estado global. */
export const selectCurrentName = (state) => state.blueprints.current?.name || ''

/** Planos del autor consultado. */
export const selectAuthorBlueprints = createSelector(
  [(state) => state.blueprints.byAuthor, selectSelectedAuthor],
  (byAuthor, author) => byAuthor[author] || [],
)

/** Suma de puntos de todos los planos del autor consultado. */
export const selectTotalPoints = createSelector([selectAuthorBlueprints], (items) =>
  items.reduce((total, bp) => total + (bp.points?.length || 0), 0),
)

/** Autores derivados del catalogo general. */
export const selectAuthors = createSelector([selectAllBlueprints], (all) =>
  [...new Set(all.map((bp) => bp.author))].sort(),
)

/** Top 5 de planos por cantidad de puntos, memoizado sobre el catalogo. */
export const selectTopFiveByPoints = createSelector([selectAllBlueprints], (all) =>
  [...all]
    .sort((a, b) => (b.points?.length || 0) - (a.points?.length || 0))
    .slice(0, 5)
    .map((bp) => ({ author: bp.author, name: bp.name, points: bp.points?.length || 0 })),
)

export default slice.reducer
