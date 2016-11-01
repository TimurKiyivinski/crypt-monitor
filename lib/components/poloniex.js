const blessed = require('blessed')
const contrib = require('blessed-contrib')
const exec = require('child_process').exec
const request = require('request')

const seconds = require('./shared.js').seconds
const pointArr = require('./shared.js').pointArr
const flatten = require('./shared.js').flatten

const PoloniexComponent = config => {
  // Create main data
  const poloniexSeries = {
    headers: flatten('ticker', config.watch),
    data: flatten('ticker', config.watch),
    content: [],
    apply: () => {
      content = []
      config.filter
        .map(ticker => flatten([ticker, content[ticker]]))
    // TODO: Complete this
    },
    update: () => {
      request(`https://poloniex.com/public?command=returnTicker`, (err, response, body) => {
        if (!err && response.statusCode === 200) {
          content = JSON.parse(body)
          apply()
        }
      })
    }
  }

  setInterval(poloniexSeries.update, seconds(config.interval))

  // Create blessed components
  const poloniexBox = blessed.box(config.box)

  const poloniexTable = contrib.table({
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: true,
    label: 'Active Processes',
    width: '30%',
    height: '30%',
    border: {type: 'line', fg: 'cyan'},
    columnSpacing: 10,
    columnWidth: [16, 12, 12]
  })

  // Create update method for class
  poloniexBox.update = () => {
    poloniexTable.setData(poloniexSeries)
  }

  poloniexBox.append(poloniexChart)

  // Return component
  return poloniexBox
}

module.exports = PoloniexComponent
