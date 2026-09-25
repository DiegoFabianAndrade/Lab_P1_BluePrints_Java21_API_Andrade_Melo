/**
 * Banner de error con accion de reintento.
 *
 * Recibe el texto ya traducido por el interceptor de Axios y dispara de nuevo el
 * thunk que fallo, sin que el usuario tenga que recargar la pagina.
 */
export default function ErrorBanner({ message, onRetry, onDismiss }) {
  if (!message) return null

  return (
    <div className="banner error" role="alert">
      <span className="banner-text">{message}</span>
      <span className="banner-actions">
        {onRetry && (
          <button className="btn" onClick={onRetry}>
            Reintentar
          </button>
        )}
        {onDismiss && (
          <button className="btn ghost" onClick={onDismiss} aria-label="Cerrar aviso">
            Cerrar
          </button>
        )}
      </span>
    </div>
  )
}
