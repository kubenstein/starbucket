/* eslint-disable no-multi-spaces */
'use strict'

const NodeDiscover = require('node-discover')
const GitServer = require('./starbucket/git-server.js')
const GatewayServer = require('./starbucket/proxy-server.js')
const Logger = require('./console-logger.js')

class Starbucket {
  constructor (attrs) {
    this.gatewayServerPort     = attrs.gatewayServerPort
    this.gitServerPort         = attrs.gitServerPort
    this.localReposStoragePath = attrs.localReposStoragePath
    this.logger                = attrs.logger || new Logger()

    this.net           = undefined
    this.gatewayServer = this.configureGatewayServer()
    this.gitServer     = this.configureGitServer((repoName) => {
      this.net.send('update-available', { repoName: repoName })
    })
  }

  start () {
    return Promise.all([
      this.gitServer.start(),
      this.configureAndStartDiscoveryService()
    ])
  }

  stop () {
    return Promise.all([
      this.gitServer.stop(),
      this.net.stop()
    ])
  }

  clearTmp () {
    return this.gitServer.clearTmp()
  }

  isMasterNode () {
    if(!this.net) return false
    return this.net.me.isMaster
  }

  // net events

  onPromoteToMaster () {
    this.logger.log('net', 'promotion to be a MASTER node')

    this.net.leave('update-available')
    this.gatewayServer.restartWithTargetUrl('http://localhost:' + this.gitServerPort)
  }

  onNewMasterChosen (netNodeInfo) {
    this.logger.log('net', 'other node is a MASTER: ' + netNodeInfo.address)

    this.gatewayServer.restartWithTargetUrl(
      'http://' + netNodeInfo.address + ':' + netNodeInfo.advertisement.gitServerPort
    )

    this.net.join('update-available', (data) => {
      this.logger.log('net', 'update available for: ' + data.repoName)
      this.gitServer.mirrorRepo(this.gatewayServer.getTargetUrl(), data.repoName)
    })
  }

  // setup

  configureAndStartDiscoveryService () {
    return new Promise((resolve) => {
      this.net = NodeDiscover({ ignoreProcess: false })
      this.net.advertise({ gitServerPort: this.gitServerPort })

      this.net.once('promotion', resolve)
      this.net.once('master',    resolve)

      this.net.on('promotion', ()            => { this.onPromoteToMaster() })
      this.net.on('master',    (netNodeInfo) => { this.onNewMasterChosen(netNodeInfo) })
      this.net.on('demotion',  ()            => { this.logger.log('net', 'demoted from being a MASTER') })
      this.net.on('added',     (netNodeInfo) => { this.logger.log('net', 'new node discovered: ' + netNodeInfo.address) })
      this.net.on('removed',   (netNodeInfo) => { this.logger.log('net', 'node removed ' + netNodeInfo.address) })
    })
  }

  configureGatewayServer () {
    return new GatewayServer({
      logger: this.logger,
      port: this.gatewayServerPort
    })
  }

  configureGitServer (gitDataReceivedCallback) {
    return new GitServer({
      logger: this.logger,
      port: this.gitServerPort,
      storagePath: this.localReposStoragePath,
      dataReceivedCallback: gitDataReceivedCallback
    })
  }
}

module.exports = Starbucket
