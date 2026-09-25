import { describe, it, expect, beforeEach } from 'vitest'
import reducer, {
  login,
  logout,
  selectIsAuthenticated,
  selectUsername,
} from '../src/features/auth/authSlice.js'

describe('auth slice', () => {
  beforeEach(() => localStorage.clear())

  it('arranca sin sesion', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.token).toBeNull()
    expect(selectIsAuthenticated({ auth: state })).toBe(false)
  })

  it('guarda el token y el usuario al iniciar sesion', () => {
    const state = reducer(undefined, {
      type: login.fulfilled.type,
      payload: { token: 'abc', username: 'student' },
    })
    expect(state.status).toBe('succeeded')
    expect(selectIsAuthenticated({ auth: state })).toBe(true)
    expect(selectUsername({ auth: state })).toBe('student')
  })

  it('registra el error cuando el login falla', () => {
    const state = reducer(undefined, {
      type: login.rejected.type,
      payload: 'Credenciales invalidas',
    })
    expect(state.status).toBe('failed')
    expect(state.error).toBe('Credenciales invalidas')
    expect(state.token).toBeNull()
  })

  it('limpia todo al cerrar sesion', () => {
    localStorage.setItem('blueprints.token', 'abc')
    localStorage.setItem('blueprints.user', 'student')
    let state = reducer(undefined, {
      type: login.fulfilled.type,
      payload: { token: 'abc', username: 'student' },
    })
    state = reducer(state, logout())
    expect(state.token).toBeNull()
    expect(state.username).toBeNull()
    expect(localStorage.getItem('blueprints.token')).toBeNull()
    expect(localStorage.getItem('blueprints.user')).toBeNull()
  })
})
