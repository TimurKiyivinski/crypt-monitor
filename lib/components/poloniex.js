const contrib = require('blessed-contrib')
const request = require('request')

const seconds = require('./shared.js').seconds
const filterMap = require('./shared.js').filterMap
const flatten = require('./shared.js').flatten
const flattenMap = require('./shared.js').flattenMap
const mergeMap = require('./shared.js').mergeMap
const jsonThen = require('./shared.js').jsonThen

const PoloniexComponent = config => {
  // Create main data
  const poloniexSeries = {
    headers: flatten(['tickers', config.watch]),
    data: [flatten(['ticker', config.watch])],
    apply: content => {
      poloniexSeries.data = config.filter
        .map(ticker => flatten([ticker, flattenMap(filterMap(content[ticker], config.watch))]))
    },
    update: () => {
      request(`https://poloniex.com/public?command=returnTicker`, (err, response, body) => {
        if (!err && response.statusCode === 200) {
          jsonThen(body, data => poloniexSeries.apply(data))
        }
      })
    }
  }

  poloniexSeries.update()

  setInterval(poloniexSeries.update, seconds(config.interval))

  // Create blessed components
  const poloniexTable = contrib.table(mergeMap({
    keys: true,
    interactive: false,
    label: 'Poloniex',
    columnWidth: flatten(['tickers', config.watch]).map(key => key.length)
  }, config.table))

  // Create update method for class
  poloniexTable.update = () => {
    poloniexTable.setData(poloniexSeries)
  }

  // Return component
  return poloniexTable
}

module.exports = PoloniexComponent
