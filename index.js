const NodeDiscover = require('node-discover')
const GitServer = require('./lib/git-server.js')
const GatewayServer = require('./lib/proxy-server.js')

const gatewayServerPort = process.env.GATEWAY_PORT || 7070
const gitServerPort = process.env.GIT_SERVER_PORT || 7000
const localReposStoragePath = '.tmp/repos/'

const net = NodeDiscover()
net.advertise({
  gitServerPort: gitServerPort
});

const gatewayServer = new GatewayServer(gatewayServerPort)

const gitServer = new GitServer({
  port: gitServerPort,
  storagePath: localReposStoragePath,
  dataReceivedCallback: (repoName) => {
    net.send('update-available', {repoName: repoName})
  }
})
gitServer.start()
.then(() => {
  console.log('local http git server started')
})

net.on('promotion', () => {
  console.log('I was promoted to a master.')

  net.leave('update-available')
  gatewayServer.restartWithTargetUrl('http://localhost:' + gitServerPort)
  console.log('reconfiguring gateway, entry address: http://localhost:' + gatewayServerPort + ' (pointing at: '+ gatewayServer.getTargetUrl() +')')
})

net.on('demotion', () => {
  console.log('I was demoted from being a master.')
})

net.on('master', (obj) => {
  console.log('A new master is in control')

  const newGitMasterServerIp = obj.address
  const newGitMasterServerPort = obj.advertisement.gitServerPort
  gatewayServer.restartWithTargetUrl('http://' + newGitMasterServerIp + ':' + newGitMasterServerPort)
  console.log('reconfiguring gateway, entry address: http://localhost:' + gatewayServerPort + ' (pointing at: '+ gatewayServer.getTargetUrl() +')')

  net.join('update-available', (data) => {
    gitServer.mirrorRepo(gatewayServer.getTargetUrl(), data.repoName)
  })
})

net.on('added', (obj) => {
  console.log('A new node has been added.')
})

net.on('removed', (obj) => {
  console.log('A node has been removed.')
})
