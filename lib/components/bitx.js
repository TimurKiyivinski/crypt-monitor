const blessed = require('blessed')
const contrib = require('blessed-contrib')
const exec = require('child_process').exec
const request = require('request')

const seconds = require('./shared.js').seconds
const pointArr = require('./shared.js').pointArr

const BitXComponent = config => {
  const createBitXSeries = ticker => ({
    name: ticker.name,
    title: `${ticker.name}`,
    style: ticker.style,
    interval: ticker.interval,
    x: pointArr(config.points, '*'),
    y: pointArr(config.points, 0)
  })

  const createBitXFunction = ticker => {
    const createBitXFunctionCall = () => {
      request(`https://api.mybitx.com/api/1/ticker?pair=${ticker.name}`, (err, response, body) => {
        if (!err && response.statusCode === 200) {
          const data = JSON.parse(body)
          const val = parseFloat(data[config.watch])
          ticker.title = `${val} ${ticker.name}`
          ticker.y.shift()
          ticker.y.push(val)
        }
      })
    }
    createBitXFunctionCall()
    setInterval(createBitXFunctionCall, seconds(ticker.interval))
    return ticker
  }

  // Create main data
  const bitXSeries = config.tickers
    .map(createBitXSeries)
    .map(createBitXFunction)

  // Create blessed components
  const bitXBox = blessed.box(config.box)

  const bitXChart = contrib.line({
    style: config.style,
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    wholeNumbersOnly: false,
    label: `BitX ${config.watch}`
  })

  // Create update method for class
  bitXBox.update = () => {
    bitXChart.setData(bitXSeries)
  }

  bitXBox.append(bitXChart)

  // Return component
  return bitXBox
}

module.exports = BitXComponent
