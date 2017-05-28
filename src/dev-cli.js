const Starbucket = require('../lib/starbucket.js')

new Starbucket({
  gatewayServerPort: process.env.GATEWAY_PORT || 7070,
  gitServerPort: process.env.GIT_SERVER_PORT || 7000,
  localReposStoragePath: process.env.STORAGE_PATH || '.tmp/repos'
}).start()
