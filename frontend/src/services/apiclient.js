import http, { writeToken } from './httpClient.js'

const BASE = '/api/v1/blueprints'

/**
 * Desempaqueta el sobre uniforme del backend: { code, message, data }.
 * Si algun dia el endpoint responde el recurso plano, lo devuelve tal cual.
 */
function unwrap(response) {
  const body = response.data
  return body && typeof body === 'object' && 'data' in body ? body.data : body
}

/** Normaliza un plano para que el resto de la aplicacion siempre vea la misma forma. */
function toBlueprint(raw) {
  return {
    author: raw.author,
    name: raw.name,
    points: (raw.points || []).map((p) => ({ x: Number(p.x), y: Number(p.y) })),
  }
}

const path = (...parts) => [BASE, ...parts.map(encodeURIComponent)].join('/')

/**
 * Cliente contra el API REST real (Labs 3 y 4).
 *
 * Implementa la misma interfaz que `apimock`, de modo que la aplicacion puede
 * intercambiar uno por otro sin tocar componentes ni slices.
 */
const apiclient = {
  name: 'apiclient',

  async login(username, password) {
    const { data } = await http.post('/auth/login', { username, password })
    const token = data.access_token ?? data.token
    writeToken(token)
    return { token, tokenType: data.token_type, expiresIn: data.expires_in, username }
  },

  async getAll() {
    const data = unwrap(await http.get(BASE))
    return (data || []).map(toBlueprint)
  },

  async getByAuthor(author) {
    const data = unwrap(await http.get(path(author)))
    return (data || []).map(toBlueprint)
  },

  async getByAuthorAndName(author, name) {
    const data = unwrap(await http.get(path(author, name)))
    return toBlueprint(data)
  },

  async create(blueprint) {
    const data = unwrap(
      await http.post(BASE, {
        author: blueprint.author,
        name: blueprint.name,
        points: blueprint.points || [],
      }),
    )
    return toBlueprint(data)
  },

  async addPoint(author, name, point) {
    await http.put(path(author, name, 'points'), { x: point.x, y: point.y })
    return this.getByAuthorAndName(author, name)
  },

  async update(author, name, points) {
    const data = unwrap(await http.put(path(author, name), { author, name, points }))
    return toBlueprint(data)
  },

  async remove(author, name) {
    await http.delete(path(author, name))
    return { author, name }
  },
}

export default apiclient
