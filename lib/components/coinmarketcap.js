const blessed = require('blessed')
const contrib = require('blessed-contrib')
const exec = require('child_process').exec
const request = require('request')

const seconds = require('./shared.js').seconds
const pointArr = require('./shared.js').pointArr
const filterMap = require('./shared.js').filterMap
const flatten = require('./shared.js').flatten
const flattenMap = require('./shared.js').flattenMap
const mergeMap = require('./shared.js').mergeMap
const jsonThen = require('./shared.js').jsonThen

const CoinMarketCapComponent = config => {
  // Create main data
  const coinMarketCapSeries = {
    headers: flatten(['tickers', config.watch]),
    data: [flatten(['ticker', config.watch])],
    apply: content => {
      coinMarketCapSeries.data = content
        .filter(ticker => config.filter.indexOf(ticker.symbol) !== -1)
        .map(ticker => filterMap(ticker, flatten(['symbol', config.watch])))
        .map(ticker => flattenMap(ticker))
    },
    update: () => {
      request(`https://api.coinmarketcap.com/v1/ticker/`, (err, response, body) => {
        if (!err && response.statusCode === 200) {
          jsonThen(body, data => coinMarketCapSeries.apply(data))
        }
      })
    }
  }

  coinMarketCapSeries.update()

  setInterval(coinMarketCapSeries.update, seconds(config.interval))

  // Create blessed components
  const coinMarketCapTable = contrib.table(mergeMap({
    keys: true,
    interactive: false,
    label: 'CoinMarketCap',
    columnWidth: flatten(['tickers', config.watch]).map(key => key.length)
  }, config.table))

  // Create update method for class
  coinMarketCapTable.update = () => {
    coinMarketCapTable.setData(coinMarketCapSeries)
  }

  // Return component
  return coinMarketCapTable
}

module.exports = CoinMarketCapComponent
