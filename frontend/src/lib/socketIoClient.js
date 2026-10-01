import { io } from 'socket.io-client'

export function createSocket(baseUrl = 'http://localhost:3001') {
  const socket = io(baseUrl, {
    transports: ['websocket'],
    autoConnect: true,
  })
  return socket
}
