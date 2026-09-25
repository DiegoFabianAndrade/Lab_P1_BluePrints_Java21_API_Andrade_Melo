import apiclient from './apiclient.js'
import apimock from './apimock.js'

/**
 * Punto unico de conmutacion entre el mock y el API real.
 *
 * Basta cambiar VITE_USE_MOCK en el archivo .env para que toda la aplicacion
 * use una implementacion u otra: ningun componente ni slice sabe cual esta
 * activa, porque ambas exponen la misma interfaz
 * (login, getAll, getByAuthor, getByAuthorAndName, create, addPoint, update, remove).
 */
export const USE_MOCK = String(import.meta.env?.VITE_USE_MOCK).toLowerCase() === 'true'

const blueprintsService = USE_MOCK ? apimock : apiclient

export default blueprintsService
