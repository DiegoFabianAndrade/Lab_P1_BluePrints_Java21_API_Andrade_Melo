import { writeToken } from './httpClient.js'

/** Semilla identica a data.sql del backend, para que el mock responda lo mismo. */
const SEED = [
  {
    author: 'john',
    name: 'house',
    points: [
      { x: 30, y: 30 },
      { x: 220, y: 30 },
      { x: 220, y: 200 },
      { x: 30, y: 200 },
      { x: 30, y: 30 },
    ],
  },
  {
    author: 'john',
    name: 'garage',
    points: [
      { x: 60, y: 60 },
      { x: 180, y: 60 },
      { x: 180, y: 160 },
    ],
  },
  {
    author: 'jane',
    name: 'garden',
    points: [
      { x: 40, y: 120 },
      { x: 90, y: 60 },
      { x: 150, y: 140 },
      { x: 210, y: 70 },
    ],
  },
  {
    author: 'jane',
    name: 'pool',
    points: [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
      { x: 300, y: 250 },
      { x: 100, y: 250 },
    ],
  },
]

const clone = (bp) => ({ ...bp, points: bp.points.map((p) => ({ ...p })) })

let store = SEED.map(clone)

/** Simula la latencia de red para que los estados de carga sean visibles. */
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

function notFound(message) {
  return Object.assign(new Error(message), { status: 404 })
}

/**
 * Implementacion en memoria con la misma interfaz que `apiclient`.
 * Permite trabajar en la UI sin backend levantado.
 */
const apimock = {
  name: 'apimock',

  /** Reinicia la memoria del mock; usado por las pruebas. */
  reset() {
    store = SEED.map(clone)
  },

  async login(username, password) {
    await delay(60)
    if (!username || !password) {
      throw Object.assign(new Error('Credenciales invalidas'), { status: 401 })
    }
    const token = `mock-token.${btoa(username)}.signature`
    writeToken(token)
    return { token, tokenType: 'Bearer', expiresIn: 3600, username }
  },

  async getAll() {
    await delay()
    return store.map(clone)
  },

  async getByAuthor(author) {
    await delay()
    return store.filter((bp) => bp.author === author).map(clone)
  },

  async getByAuthorAndName(author, name) {
    await delay()
    const found = store.find((bp) => bp.author === author && bp.name === name)
    if (!found) throw notFound(`El plano ${name} de ${author} no existe`)
    return clone(found)
  },

  async create(blueprint) {
    await delay()
    const exists = store.some((bp) => bp.author === blueprint.author && bp.name === blueprint.name)
    if (exists) {
      throw Object.assign(new Error('El plano ya existe'), { status: 400 })
    }
    const created = clone({ ...blueprint, points: blueprint.points || [] })
    store.push(created)
    return clone(created)
  },

  async addPoint(author, name, point) {
    await delay()
    const found = store.find((bp) => bp.author === author && bp.name === name)
    if (!found) throw notFound(`El plano ${name} de ${author} no existe`)
    found.points.push({ x: point.x, y: point.y })
    return clone(found)
  },

  async update(author, name, points) {
    await delay()
    const found = store.find((bp) => bp.author === author && bp.name === name)
    if (!found) throw notFound(`El plano ${name} de ${author} no existe`)
    found.points = points.map((p) => ({ ...p }))
    return clone(found)
  },

  async remove(author, name) {
    await delay()
    const before = store.length
    store = store.filter((bp) => !(bp.author === author && bp.name === name))
    if (store.length === before) throw notFound(`El plano ${name} de ${author} no existe`)
    return { author, name }
  },
}

export default apimock
