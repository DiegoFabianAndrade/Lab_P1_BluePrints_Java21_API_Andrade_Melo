import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import service from '../../services/blueprintsService.js'
import { readToken, writeToken } from '../../services/httpClient.js'

const USER_KEY = 'blueprints.user'

function readUser() {
  try {
    return localStorage.getItem(USER_KEY)
  } catch {
    return null
  }
}

function writeUser(username) {
  try {
    if (username) localStorage.setItem(USER_KEY, username)
    else localStorage.removeItem(USER_KEY)
  } catch {
    /* localStorage no disponible */
  }
}

/**
 * Pide el token al backend y lo deja guardado.
 *
 * El interceptor de Axios se encarga de adjuntarlo en las peticiones siguientes,
 * de modo que ningun componente manipula la cabecera Authorization a mano.
 */
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const session = await service.login(username, password)
      writeUser(session.username)
      return session
    } catch (error) {
      return rejectWithValue(error?.message || 'No fue posible iniciar sesion')
    }
  },
)

const slice = createSlice({
  name: 'auth',
  // El token sobrevive a un refresco de la pagina: se rehidrata desde localStorage.
  initialState: {
    token: readToken(),
    username: readUser(),
    status: 'idle',
    error: null,
  },
  reducers: {
    logout(state) {
      writeToken(null)
      writeUser(null)
      state.token = null
      state.username = null
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => {
        s.status = 'loading'
        s.error = null
      })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.token = a.payload.token
        s.username = a.payload.username
      })
      .addCase(login.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.payload || 'No fue posible iniciar sesion'
        s.token = null
        s.username = null
      })
  },
})

export const { logout } = slice.actions

export const selectIsAuthenticated = (state) => Boolean(state.auth.token)
export const selectUsername = (state) => state.auth.username
export const selectAuthStatus = (state) => state.auth.status
export const selectAuthError = (state) => state.auth.error

export default slice.reducer
