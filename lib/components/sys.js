const blessed = require('blessed')
const contrib = require('blessed-contrib')
const exec = require('child_process').exec

const seconds = require('./shared.js').seconds
const pointArr = require('./shared.js').pointArr

const SysComponent = config => {
  const createSysSeries = device => ({
    name: device.name,
    title: `${device.name} 00`,
    style: device.style,
    command: device.command,
    interval: device.interval,
    x: pointArr(config.points, '*'),
    y: pointArr(config.points, 0)
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

  // Create main data
  const sysSeries = config.devices
    .map(createSysSeries)
    .map(createSysFunction)

  // Create blessed components
  const sysBox = blessed.box(config.box)

  const sysChart = contrib.line({
    style: config.style,
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    label: 'System'
  })

  // Create update method for class
  sysBox.update = () => {
    sysChart.setData(sysSeries)
  }

  sysBox.append(sysChart)

  // Return component
  return sysBox
}

module.exports = SysComponent
