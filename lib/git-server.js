const http = require('http')
const spawn = require('child_process').spawn
const nodeGitServer = require('node-git-server')

class GitServer {
  constructor (attrs) {
    const port = attrs.port
    const storagePath = attrs.storagePath
    const dataReceivedCallback = attrs.dataReceivedCallback

    this.port = port
    this.storagePath = storagePath
    this.server = this.createServer(storagePath, dataReceivedCallback)
  }

  start () {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        resolve()
      })
    })
  }

  stop () {
    return new Promise((resolve) => {
      this.server.close(() => {
        resolve()
      })
    })
  }

  mirrorRepo (remoteServerIp, repoName) {
    console.log('pulling "' + repoName + '" from: ' + remoteServerIp)

    const remoteGitServerPort = this.port
    const localRepoPath = this.storagePath + repoName + '.git/'
    const remoteRepoAddress = 'http://' + remoteServerIp + ':' + remoteGitServerPort + '/' + repoName

    return this.initializeRepoIfneeded(localRepoPath)
    .then(() => {
      this.sync(localRepoPath, remoteRepoAddress)
    })
  }

  // private

  createServer (repoStoragePath, dataReceivedCallback) {
    const gitOperationHandler = nodeGitServer(repoStoragePath)

    gitOperationHandler.on('push', (push) => {
      console.log('push ' + push.repo + '/' + push.commit + ' (' + push.branch + ')')
      push.accept()
      dataReceivedCallback(push.repo)
    })

    return http.createServer((req, res) => {
      gitOperationHandler.handle(req, res)
    })
  }

  initializeRepoIfneeded (localRepoPath) {
    return new Promise((resolve) => {
      const proc = spawn('git', ['init', '--bare', localRepoPath])
      proc.on('close', () => {
        resolve()
      })
    })
  }

  sync (localRepoPath, remoteRepoAddress) {
    spawn('git', ['--git-dir=' + localRepoPath, 'fetch', remoteRepoAddress, '+refs/heads/*:refs/heads/*'])
  }
}

module.exports = GitServer
