const fs = require('fs')
const exec = require('child_process').exec
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const request = require('request')

const seconds = val => val * 1000
const pointArr = (size, filler) => Array(size).fill(filler)
const flatten = arr => [].concat(...arr)

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

  const createSuprnovaSeries = pool => ({
    name: pool.name,
    title: `${pool.name}`,
    style: pool.style,
    interval: pool.interval,
    api_key: pool.api_key,
    x: pointArr(env.novaexchange.points, '*'),
    y: pointArr(env.novaexchange.points, 0)
  })

  const createSuprnovaFunction = pool => {
    const createSuprnovaFunctionCall = () => {
      request(`https://${pool.name}.suprnova.cc/index.php?page=api&action=getuserworkers&api_key=${pool.api_key}`, (err, response, body) => {
        if (!err && response.statusCode === 200) {
          const data = JSON.parse(body)
          const hashrate = data.getuserworkers.data
            .map(worker => worker.hashrate)
            .reduce((a, b) => a + b)
          pool.title = `${pool.name} ${hashrate}`
          pool.y.shift()
          pool.y.push(hashrate)
        }
      })
    }
    createSuprnovaFunctionCall()
    setInterval(createSuprnovaFunctionCall, seconds(pool.interval))
    return pool
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
    left: 'left',
    width: '40%',
    height: '30%',
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

  const suprnovaBox = blessed.box({
    top: '30%',
    left: '40%+1',
    width: '60%',
    height: '30%',
    border: {
      type: 'line'
    }
  })

  const suprnovaChart = contrib.line({
    style: env.system.style,
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    wholeNumbersOnly: false,
    label: 'Suprnova Hashrate'
  })

  const suprnovaSeries = env.suprnova.pools
    .map(createSuprnovaSeries)
    .map(createSuprnovaFunction)

  // Add NovaExchange charts
  screen.append(suprnovaBox)
  suprnovaBox.append(suprnovaChart)

  // Render screen
  setInterval(function () {
    sysChart.setData(sysSeries)
    novaExchangeChart.setData(novaExchangeSeries)
    suprnovaChart.setData(suprnovaSeries)
    screen.render()
  }, seconds(1))
})()
