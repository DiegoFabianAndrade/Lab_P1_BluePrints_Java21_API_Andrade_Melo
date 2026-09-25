import axios from 'axios'

export const TOKEN_KEY = 'blueprints.token'

/**
 * Instancia unica de Axios para hablar con el backend de Blueprints.
 *
 * La URL base apunta a la raiz del servidor (no a /api) porque el backend expone
 * dos prefijos distintos: /auth para la emision del token y /api/v1 para los
 * recursos protegidos.
 */
const http = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
})

export function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* localStorage no disponible (modo privado o entorno de pruebas) */
  }
}

/** Interceptor de peticion: adjunta el JWT a cada llamada cuando existe. */
http.interceptors.request.use((config) => {
  const token = readToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Interceptor de respuesta: traduce los errores del backend a mensajes legibles
 * y limpia el token cuando el servidor lo rechaza.
 */
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    if (status === 401) writeToken(null)
    const envelope = err.response?.data
    const message =
      envelope?.message ||
      envelope?.error ||
      (status === 401 && 'Sesion no valida: inicia sesion para continuar') ||
      (status === 403 && 'No tienes permisos suficientes para esta operacion') ||
      (status === 404 && 'Recurso no encontrado') ||
      err.message ||
      'Error de comunicacion con el servidor'
    return Promise.reject(Object.assign(new Error(message), { status, cause: err }))
  },
)

export default http
