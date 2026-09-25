/**
 * Tabla de planos de un autor.
 *
 * Columnas exigidas por el laboratorio: nombre del plano, numero de puntos y el
 * boton Open que lo lleva al lienzo. El boton de borrado solo aparece cuando la
 * sesion tiene permiso de escritura.
 */
export default function BlueprintTable({ items = [], onOpen, onDelete, currentName }) {
  if (!items.length) {
    return <p className="muted">No hay planos para este autor.</p>
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Blueprint name</th>
            <th className="right">Number of points</th>
            <th aria-label="Acciones"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((bp) => (
            <tr
              key={`${bp.author}/${bp.name}`}
              className={bp.name === currentName ? 'row-active' : undefined}
            >
              <td>{bp.name}</td>
              <td className="right">{bp.points?.length || 0}</td>
              <td className="actions">
                <button className="btn primary" onClick={() => onOpen(bp)}>
                  Open
                </button>
                {onDelete && (
                  <button
                    className="btn danger"
                    onClick={() => onDelete(bp)}
                    title={`Eliminar ${bp.name}`}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
