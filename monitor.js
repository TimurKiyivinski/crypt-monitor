const fs = require('fs')
const exec = require('child_process').exec
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const request = require('request')

const seconds = val => val * 1000
const pointArr = (size, filler) => Array(size).fill(filler)

;(function () {
  // Environment variables
  const env = JSON.parse(fs.readFileSync('env.json', 'utf8'))

  // Functions
  const createSysSeries = device => ({
    name: device.name,
    title: `${device.name} 00`,
    style: device.style,
    command: device.command,
    interval: device.interval,
    x: pointArr(env.system.points, '*'),
    y: pointArr(env.system.points, 0)
  })

  const createSysFunction = device => {
    const createSysFunctionCall = () => {
      exec(device.command, (err, stdout, stderr) => {
        if (!err) {
          device.title = `${device.name} ${stdout}`
          device.y.shift()
          device.y.push(parseInt(stdout))
        }
      })
    }
    createSysFunctionCall()
    setInterval(createSysFunctionCall, seconds(device.interval))
    return device
  }

  const createNovaExchangeSeries = market => ({
    name: market.name,
    title: `${market.name}`,
    style: market.style,
    interval: market.interval,
    x: pointArr(env.novaexchange.points, '*'),
    y: pointArr(env.novaexchange.points, 0)
  })

  const createNovaExchangeFunction = market => {
    const createNovaExchangeFunctionCall = () => {
      request(`https://novaexchange.com/remote/v2/market/info/${market.name}`, (err, response, body) => {
        if (!err && response.statusCode === 200) {
          const data = JSON.parse(body)
          data.markets.map(markets => {
            const ask = parseFloat(markets.ask) * env.novaexchange.multiplier
            market.title = `${parseInt(ask)} ${market.name}`
            market.y.shift()
            market.y.push(ask)
          })
        }
      })
    }
    createNovaExchangeFunctionCall()
    setInterval(createNovaExchangeFunctionCall, seconds(market.interval))
    return market
  }

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

  const sysSeries = env.system.devices
    .map(createSysSeries)
    .map(createSysFunction)

  // Add sys charts
  screen.append(sysBox)
  sysBox.append(sysChart)

  const novaExchangeBox = blessed.box({
    top: '30%',
    left: 'center',
    width: '100%',
    height: '70%',
    border: {
      type: 'line'
    }
  })

  const novaExchangeChart = contrib.line({
    style: env.system.style,
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    wholeNumbersOnly: false,
    label: `Nova Exchange * ${env.novaexchange.multiplier}`
  })

  const novaExchangeSeries = env.novaexchange.markets
    .map(createNovaExchangeSeries)
    .map(createNovaExchangeFunction)

  // Add NovaExchange charts
  screen.append(novaExchangeBox)
  novaExchangeBox.append(novaExchangeChart)

  // Render screen
  setInterval(function () {
    sysChart.setData(sysSeries)
    novaExchangeChart.setData(novaExchangeSeries)
    screen.render()
  }, seconds(1))
})()
