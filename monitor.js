const fs = require('fs')
const exec = require('child_process').exec
const blessed = require('blessed')
const contrib = require('blessed-contrib')

const seconds = val => val * 1000
const pointArr = (size, filler) => Array(size).fill(filler)

;(function () {
  // Environment variables
  const env = JSON.parse(fs.readFileSync('env.json', 'utf8'))

  // Create screen
  const screen = blessed.screen({
    smartSCR: true
  })
  screen.title = 'CRYPT MONITOR'

  // Exit sequence
  screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0))

  const sysBox = blessed.box({
    top: '0%',
    left: 'center',
    width: '100%',
    height: '30%',
    content: 'Sys',
    border: {
      type: 'line'
    }
  })

  const sysChart = contrib.line({
    style: env.system.style,
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    label: 'System'
  })

  const createSysSeries = device => ({
    name: device.name,
    title: `${device.name} 00`,
    style: device.style,
    command: device.command,
    interval: device.interval,
    x: pointArr(env.system.points, '*'),
    y: pointArr(env.system.points, 0)
  })

  const createSysFunction = function (device) {
    setInterval(() => {
      exec(device.command, (err, stdout, stderr) => {
        if (! err) {
          device.title = `${device.name} ${stdout}`
          device.y.shift()
          device.y.push(parseInt(stdout))
        }
      })
    }, seconds(device.interval))
    return device
  }

  const sysSeries = env.system.devices
    .map(createSysSeries)
    .map(createSysFunction)

  // Add sys charts
  screen.append(sysBox)
  sysBox.append(sysChart)
  console.log(sysSeries)
  sysChart.setData(sysSeries)

  const loadBox = blessed.box({
    top: '30%',
    left: 'center',
    width: '100%',
    height: '70%',
    border: {
      type: 'line'
    }
  })
  screen.append(loadBox)

  // Render screen
  setInterval(function () {
    sysChart.setData(sysSeries)
    screen.render()
  }, seconds(1))
})()
