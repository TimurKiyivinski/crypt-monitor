const blessed = require('blessed')
const contrib = require('blessed-contrib')
const request = require('request')

const seconds = require('./shared.js').seconds
const pointArr = require('./shared.js').pointArr
const jsonThen = require('./shared.js').jsonThen

const BittrexComponent = config => {
  const createBittrexSeries = ticker => ({
    name: ticker.name,
    title: `${ticker.name}`,
    style: ticker.style,
    interval: ticker.interval,
    x: pointArr(config.points, '*'),
    y: pointArr(config.points, 0)
  })

  const createBittrexFunction = ticker => {
    const createBittrexFunctionCall = () => {
      request(`https://bittrex.com/api/v1.1/public/getticker?market=${ticker.name}`, (err, response, body) => {
        if (!err && response.statusCode === 200) {
          jsonThen(body, data => {
            const val = data.result[config.watch]
            ticker.title = `${val} ${ticker.name}`
            ticker.y.shift()
            ticker.y.push(val)
          })
        }
      })
    }
    createBittrexFunctionCall()
    setInterval(createBittrexFunctionCall, seconds(ticker.interval))
    return ticker
  }

  // Create main data
  const bittrexSeries = config.tickers
    .map(createBittrexSeries)
    .map(createBittrexFunction)

  // Create blessed components
  const bittrexBox = blessed.box(config.box)

  const bittrexChart = contrib.line({
    style: config.style,
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    wholeNumbersOnly: false,
    label: `Bittrex ${config.watch}`
  })

  // Create update method for class
  bittrexBox.update = () => {
    bittrexChart.setData(bittrexSeries)
  }

  bittrexBox.append(bittrexChart)

  // Return component
  return bittrexBox
}

module.exports = BittrexComponent
