const httpProxy = require('http-proxy')

class ProxyServer {
  constructor (port) {
    this.port = port
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
  }

  stop () {
    if (this.server) {
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
