'use strict'

const httpProxy = require('http-proxy')

class ProxyServer {
  constructor (attrs) {
    this.port = attrs.port
    this.logger = attrs.logger
    this.targetUrl = undefined
    this.server = null
  }

  getTargetUrl () {
    return this.targetUrl
  }

  start () {
    if (!this.targetUrl) {
      throw new Error('targetUrl cant be blank')
    }

    this.server = this.createServer(this.targetUrl)
    this.server.listen(this.port)

    this.logger.log('prxy',
      'starting proxy server, entry address: ' +
      'http://localhost:' + this.port +
      ' (pointing at: ' + this.getTargetUrl() + ')'
    )
  }

  stop () {
    if (this.server) {
      this.logger.log('prxy', 'stopping proxy server')
      this.server.close()
    }
  }

  restartWithTargetUrl (targetUrl) {
    this.targetUrl = targetUrl
    this.stop()
    this.start()
  }

  // private

  createServer (targetUrl) {
    return httpProxy.createProxyServer({target: targetUrl})
  }
}

module.exports = ProxyServer
