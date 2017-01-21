'use strict'

const http = require('http')
const spawn = require('child_process').spawn
const fs = require('fs-extra')
const nodeGitServer = require('node-git-server')

class GitServer {
  constructor (attrs) {
    this.port = attrs.port
    this.storagePath = attrs.storagePath
    this.logger = attrs.logger
    const dataReceivedCallback = attrs.dataReceivedCallback

    this.server = this.createServer(this.storagePath, dataReceivedCallback)
  }

  start () {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        this.logger.log('git', 'git server started at http://localhost:' + this.port)
        resolve()
      })
    })
  }

  stop () {
    return new Promise((resolve) => {
      this.server.close()
      this.logger.log('info', 'git server stopped')
      resolve()
    })
  }

  mirrorRepo (remoteServerUrl, repoName) {
    const localRepoPath = this.storagePath + '/' + repoName + '.git/'
    const remoteRepoUrl = remoteServerUrl + '/' + repoName

    return this.initializeRepoIfneeded(localRepoPath)
    .then(() => {
      this.sync(localRepoPath, remoteRepoUrl)
    })
  }

  clearTmp () {
    this.logger.log('git', 'clearing temp files: ' + this.storagePath)

    return new Promise((resolve, reject) => {
      fs.remove(this.storagePath, (err) => {
        err ? reject(err) : resolve()
      })
    })
  }

  // private

  createServer (repoStoragePath, dataReceivedCallback) {
    const gitOperationHandler = nodeGitServer(repoStoragePath)

    gitOperationHandler.on('push', (push) => {
      this.logger.log('git', 'push received. Repo: ' + push.repo + ', branch: ' + push.branch + ' (' + push.commit + ')')
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

  sync (localRepoPath, remoteRepoUrl) {
    this.logger.log('git', 'mirroring ' + remoteRepoUrl + ' -> ' + localRepoPath)

    spawn('git', ['--git-dir=' + localRepoPath, 'fetch', remoteRepoUrl, '+refs/heads/*:refs/heads/*'])
  }
}

module.exports = GitServer
