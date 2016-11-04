const blessed = require('blessed')
const contrib = require('blessed-contrib')
const request = require('request')

const seconds = require('./shared.js').seconds
const pointArr = require('./shared.js').pointArr
const jsonThen = require('./shared.js').jsonThen

const SuprnovaComponent = config => {
  const createSuprnovaSeries = pool => ({
    name: pool.name,
    title: `${pool.name}`,
    style: pool.style,
    interval: pool.interval,
    api_key: pool.api_key,
    x: pointArr(config.points, '*'),
    y: pointArr(config.points, 0)
  })

  const createSuprnovaFunction = pool => {
    const createSuprnovaFunctionCall = () => {
      request(`https://${pool.name}.suprnova.cc/index.php?page=api&action=getuserworkers&api_key=${pool.api_key}`, (err, response, body) => {
        if (!err && response.statusCode === 200) {
          jsonThen(body, data => {
            const hashrate = data.getuserworkers.data
              .map(worker => worker.hashrate)
              .reduce((a, b) => a + b)
            pool.title = `${pool.name} ${hashrate}`
            pool.y.shift()
            pool.y.push(hashrate)
          })
        }
      })
    }
    createSuprnovaFunctionCall()
    setInterval(createSuprnovaFunctionCall, seconds(pool.interval))
    return pool
  }

  // Create main data
  const suprnovaSeries = config.pools
    .map(createSuprnovaSeries)
    .map(createSuprnovaFunction)

  // Create blessed components
  const suprnovaBox = blessed.box(config.box)

  const suprnovaChart = contrib.line({
    style: config.style,
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    wholeNumbersOnly: false,
    label: 'Suprnova Hashrate'
  })

  // Create update method for class
  suprnovaBox.update = () => {
    suprnovaChart.setData(suprnovaSeries)
  }

  suprnovaBox.append(suprnovaChart)

  // Return component
  return suprnovaBox
}

module.exports = SuprnovaComponent
