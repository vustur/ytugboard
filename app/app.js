const express = require('express')
require('dotenv').config()
const app = express()
const path = require('path')
const ws = require('ws')
const http = require('http')
const { Socket } = require('dgram')
const adminKey = process.env.ADMIN_KEY
let lines = []

app.use('/static', express.static(path.join(__dirname, 'static')))
app.use(express.static(path.join(__dirname, 'static')))
const server = http.createServer(app)
const wss = new ws.Server({ server })

wss.on('connection', (s) => {
  console.log('New client connected: ' + s.name)
  s.on('message', (data) => {
    data = JSON.parse(data)
    console.log("Message received - " + data.name + " :")
    switch (data.name) {
    case 'lineAdd':
      // console.log(data.data)
      data.data.forEach(line => {
        lines.push(line)
      })
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify({
            name: 'lineAddServ',
            data: data.data
          }))
        }
      })
    break
    case 'reqLinesSync':
      console.log('gonna sync lines')
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN && lines.length > 0) {
          client.send(JSON.stringify({
            name: 'linesSyncServ',
            data: lines
          }))
        }
      })
    break
    case 'adminReq':
      if (data.data === adminKey) {
        s.send(JSON.stringify({ name: 'adminReqResponse', data: 'success' }))
      } else {
        s.send(JSON.stringify({ name: 'adminReqResponse', data: 'invalid' }))
      }
      console.log('Req admin key - ' + data.data)
    break
    case 'nickChange':
      s.nick = data.data
      console.log('Client changed nick to ' + data.data)
    break
    default:
      console.log('Message name not recognized. Gonna ignore it')
    break
  }
  })
  s.on('close', (e) => {
    console.log('Client disconnected')
  })
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'))
})

server.listen(3000, () => {
  console.log('Ytugboard app and wss - port 3000')
})

