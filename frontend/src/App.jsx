import { NavLink, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import BlueprintsPage from './pages/BlueprintsPage.jsx'
import BlueprintDetailPage from './pages/BlueprintDetailPage.jsx'
import NewBlueprintPage from './pages/NewBlueprintPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFound from './pages/NotFound.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import { logout, selectIsAuthenticated, selectUsername } from './features/auth/authSlice.js'

export default function App() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const username = useSelector(selectUsername)

  return (
    <div className="container">
      <header>
        <h1>ECI - Laboratorio de Blueprints en React</h1>
        <nav>
          <NavLink to="/" end>
            Blueprints
          </NavLink>
          <NavLink to="/blueprints/new">Nuevo</NavLink>
          {isAuthenticated ? (
            <>
              <span className="badge">{username}</span>
              <button className="btn ghost" onClick={() => dispatch(logout())}>
                Salir
              </button>
            </>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<BlueprintsPage />} />
        <Route
          path="/blueprints/new"
          element={
            <PrivateRoute>
              <NewBlueprintPage />
            </PrivateRoute>
          }
        />
        <Route path="/blueprints/:author/:name" element={<BlueprintDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
