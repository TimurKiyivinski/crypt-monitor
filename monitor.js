// Libraries
const blessed = require('blessed')
const shared = require('./lib/components').shared

// Environment variables
const env = require('./env.js')

;(function () {
  // Create screen
  const screen = blessed.screen({
    smartSCR: true
  })
  screen.title = 'CRYPT MONITOR'

  // Exit sequence
  screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0))

  const components = Object.keys(env).map(key => {
    const component = require('./lib/components')[key](env[key])
    component.draggable = true
    component.key('h', (ch, key) => component.width -= 1)
    component.key('j', (ch, key) => component.height -= 1)
    component.key('k', (ch, key) => component.height += 1)
    component.key('l', (ch, key) => component.width += 1)
    screen.append(component)
    return component
  })

  // Render screen
  setInterval(function () {
    components.map(component => component.update())
    screen.render()
  }, shared.seconds(1))
})()
