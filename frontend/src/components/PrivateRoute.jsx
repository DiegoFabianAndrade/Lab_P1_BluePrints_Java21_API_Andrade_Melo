import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { selectIsAuthenticated } from '../features/auth/authSlice.js'

/**
 * Ruta protegida.
 *
 * Sin token en el estado global redirige al login y recuerda el destino, de modo
 * que tras autenticarse el usuario vuelve a donde queria entrar.
 */
export default function PrivateRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
