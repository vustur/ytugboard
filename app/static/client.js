const canvas = document.getElementById('canvas')
const colorPicker = document.getElementById('colorP')
const ctx = canvas.getContext('2d')
const wsConn = new WebSocket('wss://' + window.location.host)
canvas.style.backgroundColor = 'white'
let isMouseDown = false
let lastPos = { x: 0, y: 0 }
let lastPosR = { x: canvas.width / 2, y: canvas.height / 2 } // last pos for moving canvas
let newPos = { x: 0, y: 0 }
let currentLine = []
let nick = 'User without nick'

const sendMsg = (name, data = []) => {
  wsConn.send(JSON.stringify({
      name,
      data
  }))
}

let nickPrompt = prompt("Введите ник (В текущей версии ник не будет отображаться публично)")
if (nickPrompt) {
  nick = nickPrompt
  setTimeout(() => {
    sendMsg('nickChange', nick)
  }, 500)
}

const runWhileNotConnected = (func) => {
  if (wsConn.readyState !== 1) {
    setTimeout(() => {
      console.log("Looks like we are not connected to WS. Retrying...")
      runWhileNotConnected(func)
    }, 500)
  }
  else {
    console.log("Connected to WS")
    func()
  }
}
runWhileNotConnected(() => {
  sendMsg("reqLinesSync")
})

let rectPos = { x: 0, y: 0 }
let rectOffset = 300
console.log(canvas.width)
while (rectPos.x < canvas.width + 300) {
  ctx.beginPath()
  ctx.rect(rectPos.x, rectPos.y, rectOffset, rectOffset)
  ctx.fillStyle = '#f6f6f6'
  ctx.fill()
  ctx.closePath()
  rectPos.y += rectOffset * 2
  if (rectPos.y > canvas.height) {
    rectPos.y = 0
    rectPos.x += rectOffset
    if (rectPos.x % (rectOffset * 2) != 0) {
      rectPos.y += rectOffset
    }
  }
  console.log("drawing rects... " + rectPos.x + ", " + rectPos.y)
}
console.log("done drawing rects")

const moveAround = (x, y) => { // MOUSE X Y POS
    canvas.style.top = `${y - lastPosR.y}px`
    canvas.style.left = `${x - lastPosR.x}px`
  }

const draw = (lx, ly, nx, ny, clr = ctx.strokeStyle, push = true) => {
    if (lx == nx && ly == ny){
        return
    }
    ctx.beginPath()
    ctx.moveTo(lx, ly)
    ctx.lineTo(nx, ny)
    ctx.lineWidth = 5
    ctx.strokeStyle = clr
    ctx.stroke()
    ctx.closePath()
    if (push){
        currentLine.push([{ x: lx, y: ly }, { x: nx, y: ny }, clr])
    }
}

canvas.addEventListener("mousemove", (e) => {
    lastPos = newPos
    newPos = { x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop }
    if (isMouseDown && e.buttons === 1) {
      console.log("draw - " + lastPos.x + ", " + lastPos.y + " -> " + newPos.x + ", " + newPos.y)
      draw(lastPos.x, lastPos.y, newPos.x, newPos.y)
    }
  })
  addEventListener("mousemove", (e) => {
  if (e.buttons === 2) {
      moveAround(e.clientX, e.clientY)
    }
  })
  canvas.addEventListener("mousedown", (e) => {
    isMouseDown = true
    currentLine = []
    console.log("down - " + e.clientX + ", " + e.clientY)
    lastPosR = {x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop}
  })
  canvas.addEventListener("mouseup", (e) => {
    isMouseDown = false
    console.log("line completed")
    console.log(currentLine)
    console.log("up - " + e.clientX + ", " + e.clientY)
    if (currentLine.length > 0) {
      sendMsg('lineAdd', currentLine)
    }
  })
  addEventListener("contextmenu", (e) => {
    e.preventDefault()
  })

colorPicker.addEventListener('input', (e) => {
  console.log(e.target.value)
  ctx.strokeStyle = e.target.value
})

// WS Connection
wsConn.onopen = () => {
  console.log("Connected to WS")
}

wsConn.onclose = (e) => {
  console.log("Connection closed. Reason: " + e.reason)
  alert("Connection closed. Reason: " + e.reason)
}

wsConn.onerror = (e) => {
  console.error("Connection error. Reason: " + e.reason)
  alert("Connection error. Reason: " + e.reason)
}

wsConn.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  if (msg.name === 'lineAddServ'){
      console.log("message from server lineAddServ - ")
      console.log(msg.data)
      msg.data.forEach(line => {
          draw(line[0].x, line[0].y, line[1].x, line[1].y, line[2])
      });
  }
  else if (msg.name === 'linesSyncServ'){
    console.log("message from server linesSync - ")
    console.log(msg.data)
    msg.data.forEach(line => {
        draw(line[0].x, line[0].y, line[1].x, line[1].y, line[2])
    });
  }
}

function showChangelog() {
  alert("Здесь пока ничего нет, так как это первая версия...")
}
