const blessed = require('blessed')
const contrib = require('blessed-contrib')
const exec = require('child_process').exec
const request = require('request')

const seconds = require('./shared.js').seconds
const pointArr = require('./shared.js').pointArr
const jsonThen = require('./shared.js').jsonThen

const NovaExchangeComponent = config => {
  const createNovaExchangeSeries = market => ({
    name: market.name,
    title: `${market.name}`,
    style: market.style,
    interval: market.interval,
    x: pointArr(config.points, '*'),
    y: pointArr(config.points, 0)
  })

  const createNovaExchangeFunction = market => {
    const createNovaExchangeFunctionCall = () => {
      request(`https://novaexchange.com/remote/v2/market/info/${market.name}`, (err, response, body) => {
        if (!err && response.statusCode === 200) {
          jsonThen(body, data => {
            data.markets.map(markets => {
              const ask = parseFloat(markets.ask) * config.multiplier
              market.title = `${parseInt(ask)} ${market.name}`
              market.y.shift()
              market.y.push(ask)
            })
          })
        }
      })
    }
    createNovaExchangeFunctionCall()
    setInterval(createNovaExchangeFunctionCall, seconds(market.interval))
    return market
  }

  // Create main data
  const novaExchangeSeries = config.markets
    .map(createNovaExchangeSeries)
    .map(createNovaExchangeFunction)

  // Create blessed components
  const novaExchangeBox = blessed.box(config.box)

  const novaExchangeChart = contrib.line({
    style: config.style,
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    wholeNumbersOnly: false,
    label: `Nova Exchange * ${config.multiplier}`
  })

  // Create update method for class
  novaExchangeBox.update = () => {
    novaExchangeChart.setData(novaExchangeSeries)
  }

  novaExchangeBox.append(novaExchangeChart)

  // Return component
  return novaExchangeBox
}

module.exports = NovaExchangeComponent
