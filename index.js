const NodeDiscover = require('node-discover')
const GitServer = require('./lib/git-server.js')
const GatewayServer = require('./lib/proxy-server.js')
const Logger = require('./lib/console-logger.js')

const gatewayServerPort = process.env.GATEWAY_PORT || 7070
const gitServerPort = process.env.GIT_SERVER_PORT || 7000
const localReposStoragePath = '.tmp/repos/'

const logger = new Logger()
const net = configureDiscoveryService(gitServerPort)
const gatewayServer = configureGatewayServer(logger, gatewayServerPort)
const gitServer = configureAndStartGitServer(logger, gitServerPort, localReposStoragePath,
  (repoName) => {
    net.send('update-available', {repoName: repoName})
  }
)

net.on('promotion', () => {
  logger.log('net', 'promotion to MASTER')

  net.leave('update-available')
  gatewayServer.restartWithTargetUrl('http://localhost:' + gitServerPort)
})

net.on('master', (obj) => {
  logger.log('net', 'other node is a master: ' + obj.address)

  const newGitMasterServerIp = obj.address
  const newGitMasterServerPort = obj.advertisement.gitServerPort
  gatewayServer.restartWithTargetUrl('http://' + newGitMasterServerIp + ':' + newGitMasterServerPort)

  net.join('update-available', (data) => {
    logger.log('net', 'update available for: ' + data.repoName)

    gitServer.mirrorRepo(gatewayServer.getTargetUrl(), data.repoName)
  })
})

net.on('demotion', () => {
  logger.log('net', 'demoted from being a MASTER')
})

net.on('added', (obj) => {
  logger.log('net', 'new node discovered: ' + obj.address)
})

net.on('removed', (obj) => {
  logger.log('net', 'node removed ' + obj.address)
})

// setup

function configureDiscoveryService (gitServerPort) {
  const net = NodeDiscover()
  net.advertise({
    gitServerPort: gitServerPort
  })
  return net
}

function configureGatewayServer (logger, gatewayServerPort) {
  return new GatewayServer({
    logger: logger,
    port: gatewayServerPort
  })
}

function configureAndStartGitServer (logger, gitServerPort, localReposStoragePath, gitDataReceivedCallback) {
  const gitServer = new GitServer({
    logger: logger,
    port: gitServerPort,
    storagePath: localReposStoragePath,
    dataReceivedCallback: gitDataReceivedCallback
  })
  gitServer.start()
  return gitServer
}
