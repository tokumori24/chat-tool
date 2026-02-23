const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // WebSocketサーバーを作成（pathを指定）
  const wss = new WebSocketServer({
    noServer: true
  })

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url)

    // Next.jsのHMRは処理しない
    if (pathname === '/_next/webpack-hmr') {
      return
    }

    // カスタムWebSocketのみ処理
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    }
  })

  wss.on('connection', (ws) => {
    console.log('Client connected')

    ws.on('message', (message) => {
      console.log('Received:', message.toString())
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    ws.on('close', () => {
      console.log('Client disconnected')
    })
  })

  // WebSocketサーバーをグローバルに保存（APIから使用するため）
  global.wss = wss

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
