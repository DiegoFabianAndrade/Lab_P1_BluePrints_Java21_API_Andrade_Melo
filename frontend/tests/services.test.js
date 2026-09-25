import { describe, it, expect, beforeEach } from 'vitest'
import apimock from '../src/services/apimock.js'
import apiclient from '../src/services/apiclient.js'
import blueprintsService from '../src/services/blueprintsService.js'

const INTERFACE = [
  'login',
  'getAll',
  'getByAuthor',
  'getByAuthorAndName',
  'create',
  'addPoint',
  'update',
  'remove',
]

describe('servicios: interfaz comun', () => {
  it('apimock y apiclient exponen exactamente los mismos metodos', () => {
    for (const method of INTERFACE) {
      expect(typeof apimock[method]).toBe('function')
      expect(typeof apiclient[method]).toBe('function')
    }
  })

  it('blueprintsService resuelve a una de las dos implementaciones', () => {
    expect([apimock, apiclient]).toContain(blueprintsService)
  })
})

describe('apimock', () => {
  beforeEach(() => {
    apimock.reset()
    localStorage.clear()
  })

  it('devuelve el catalogo completo', async () => {
    const all = await apimock.getAll()
    expect(all.length).toBeGreaterThanOrEqual(3)
    expect(all[0]).toHaveProperty('author')
    expect(all[0]).toHaveProperty('points')
  })

  it('filtra por autor y por nombre', async () => {
    const john = await apimock.getByAuthor('john')
    expect(john.every((bp) => bp.author === 'john')).toBe(true)

    const house = await apimock.getByAuthorAndName('john', 'house')
    expect(house.name).toBe('house')
  })

  it('lanza 404 para un plano inexistente', async () => {
    await expect(apimock.getByAuthorAndName('nadie', 'nada')).rejects.toMatchObject({ status: 404 })
  })

  it('crea, agrega puntos, actualiza y elimina', async () => {
    const created = await apimock.create({ author: 'ana', name: 'lab', points: [{ x: 1, y: 1 }] })
    expect(created.points).toHaveLength(1)

    const withPoint = await apimock.addPoint('ana', 'lab', { x: 2, y: 2 })
    expect(withPoint.points).toHaveLength(2)

    const updated = await apimock.update('ana', 'lab', [{ x: 9, y: 9 }])
    expect(updated.points).toEqual([{ x: 9, y: 9 }])

    await apimock.remove('ana', 'lab')
    await expect(apimock.getByAuthorAndName('ana', 'lab')).rejects.toMatchObject({ status: 404 })
  })

  it('rechaza crear un plano duplicado', async () => {
    await expect(
      apimock.create({ author: 'john', name: 'house', points: [] }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('devuelve copias: mutar el resultado no altera la memoria del mock', async () => {
    const house = await apimock.getByAuthorAndName('john', 'house')
    house.points.push({ x: 999, y: 999 })
    const again = await apimock.getByAuthorAndName('john', 'house')
    expect(again.points.some((p) => p.x === 999)).toBe(false)
  })

  it('login guarda el token y rechaza credenciales vacias', async () => {
    const session = await apimock.login('student', 'student123')
    expect(session.token).toBeTruthy()
    expect(localStorage.getItem('blueprints.token')).toBe(session.token)
    await expect(apimock.login('', '')).rejects.toMatchObject({ status: 401 })
  })
})
