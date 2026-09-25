import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="card narrow">
      <h2>404</h2>
      <p className="muted">La pagina solicitada no existe.</p>
      <Link className="btn primary" to="/">
        Volver al inicio
      </Link>
    </div>
  )
}
