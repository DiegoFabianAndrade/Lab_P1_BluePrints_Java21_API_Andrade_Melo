import { describe, it, expect, vi } from 'vitest'
import reducer, {
  openBlueprint,
  receiveRealtimeUpdate,
} from '../src/features/blueprints/blueprintsSlice.js'
import { createStompClient, subscribeBlueprint } from '../src/lib/stompClient.js'
import { createSocket } from '../src/lib/socketIoClient.js'

describe('Real-Time STOMP & Socket.IO Client Helpers', () => {
  it('createStompClient configura correctamente la URL del broker', () => {
    const client = createStompClient('http://localhost:8080')
    expect(client.brokerURL).toBe('ws://localhost:8080/ws-blueprints')
    expect(client.reconnectDelay).toBe(2000)
  })

  it('subscribeBlueprint se suscribe al topico con el patron esperado', () => {
    const mockClient = {
      subscribe: vi.fn((topic, callback) => ({ topic, callback })),
    }
    const onMsg = vi.fn()
    subscribeBlueprint(mockClient, 'diego', 'plano-central', onMsg)

    expect(mockClient.subscribe).toHaveBeenCalledWith(
      '/topic/blueprints.diego.plano-central',
      expect.any(Function),
    )
  })

  it('subscribeBlueprint parsea el mensaje JSON recibido y llama onMsg', () => {
    let capturedCallback
    const mockClient = {
      subscribe: vi.fn((topic, callback) => {
        capturedCallback = callback
      }),
    }
    const onMsg = vi.fn()
    subscribeBlueprint(mockClient, 'diego', 'plano-1', onMsg)

    capturedCallback({ body: JSON.stringify({ points: [{ x: 10, y: 20 }] }) })
    expect(onMsg).toHaveBeenCalledWith({ points: [{ x: 10, y: 20 }] })
  })

  it('createSocket instancia socket.io con transporte websocket', () => {
    const socket = createSocket('http://localhost:3001')
    expect(socket).toBeDefined()
  })
})

describe('blueprints slice: receiveRealtimeUpdate', () => {
  const initial = () => reducer(undefined, { type: '@@INIT' })

  it('agrega puntos en tiempo real al plano actualmente abierto', () => {
    const initialBp = { author: 'juan', name: 'plano-1', points: [{ x: 0, y: 0 }] }
    let state = reducer(initial(), openBlueprint(initialBp))

    state = reducer(
      state,
      receiveRealtimeUpdate({
        author: 'juan',
        name: 'plano-1',
        points: [{ x: 50, y: 80 }],
      }),
    )

    expect(state.current.points).toHaveLength(2)
    expect(state.current.points[1]).toEqual({ x: 50, y: 80 })
  })

  it('no agrega puntos si el evento pertenece a otro plano distinto al abierto', () => {
    const initialBp = { author: 'juan', name: 'plano-1', points: [{ x: 0, y: 0 }] }
    let state = reducer(initial(), openBlueprint(initialBp))

    state = reducer(
      state,
      receiveRealtimeUpdate({
        author: 'pedro',
        name: 'otro-plano',
        points: [{ x: 99, y: 99 }],
      }),
    )

    expect(state.current.points).toHaveLength(1)
    expect(state.current.points[0]).toEqual({ x: 0, y: 0 })
  })

  it('evita insertar puntos identicos repetidos consecutivamente', () => {
    const initialBp = { author: 'juan', name: 'plano-1', points: [{ x: 10, y: 10 }] }
    let state = reducer(initial(), openBlueprint(initialBp))

    state = reducer(
      state,
      receiveRealtimeUpdate({
        author: 'juan',
        name: 'plano-1',
        points: [{ x: 10, y: 10 }],
      }),
    )

    expect(state.current.points).toHaveLength(1)
  })
})
