import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  login,
  selectAuthError,
  selectAuthStatus,
  selectIsAuthenticated,
  selectUsername,
  logout,
} from '../features/auth/authSlice.js'
import { USE_MOCK } from '../services/blueprintsService.js'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const status = useSelector(selectAuthStatus)
  const error = useSelector(selectAuthError)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const username = useSelector(selectUsername)

  const [form, setForm] = useState({ username: '', password: '' })

  const submit = async (event) => {
    event.preventDefault()
    const action = await dispatch(login(form))
    if (action.meta.requestStatus === 'fulfilled') {
      navigate(location.state?.from || '/', { replace: true })
    }
  }

  if (isAuthenticated) {
    return (
      <div className="card narrow">
        <h2>Sesion activa</h2>
        <p>
          Autenticado como <strong>{username}</strong>.
        </p>
        <div className="row">
          <button className="btn" onClick={() => navigate('/')}>
            Ir a los blueprints
          </button>
          <button className="btn danger" onClick={() => dispatch(logout())}>
            Cerrar sesion
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>Login</h2>
      <p className="muted">
        {USE_MOCK
          ? 'El modo apimock acepta cualquier usuario y contrasena no vacios.'
          : 'Usuarios del backend: student / student123 o assistant / assistant123.'}
      </p>
      <div className="field">
        <label htmlFor="login-user">Usuario</label>
        <input
          id="login-user"
          className="input"
          autoComplete="username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="login-password">Contrasena</label>
        <input
          id="login-password"
          type="password"
          className="input"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <div className="field">
        <button className="btn primary" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </form>
  )
}
