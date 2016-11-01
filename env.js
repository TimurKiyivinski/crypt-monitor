const fs = require('fs')
const env = JSON.parse(fs.readFileSync('env.json', 'utf8'))
module.exports = env
