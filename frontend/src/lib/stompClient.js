import { Client } from '@stomp/stompjs'

export function createStompClient(baseUrl = 'http://localhost:8080') {
  const url = baseUrl.replace(/^http/, 'ws').replace(/\/$/, '')
  const brokerURL = `${url}/ws-blueprints`
  const client = new Client({
    brokerURL,
    reconnectDelay: 2000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onStompError: (frame) => {
      console.error('STOMP protocol error:', frame.headers['message'], frame.body)
    },
  })
  return client
}

export function subscribeBlueprint(client, author, name, onMsg) {
  return client.subscribe(`/topic/blueprints.${author}.${name}`, (message) => {
    try {
      const parsed = JSON.parse(message.body)
      onMsg(parsed)
    } catch (err) {
      console.error('Error parsing STOMP message body:', err)
    }
  })
}
