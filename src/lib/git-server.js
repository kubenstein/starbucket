import http from 'http'
import { spawn } from 'child_process'
import fs from 'fs-extra'
import nodeGitServer from 'node-git-server'

export default class GitServer {
  constructor (attrs) {
    this.port = attrs.port
    this.storagePath = attrs.storagePath
    this.logger = attrs.logger
    const onDataReceived = attrs.onDataReceived

    this.server = this.createServer(this.storagePath, onDataReceived)
  }

  start () {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        this.logger.log('git', `git server started at http://localhost:${this.port}`)
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
    const localRepoPath = `${this.storagePath}/${repoName}.git/`
    const remoteRepoUrl = `${remoteServerUrl}/${repoName}`

    return this.initializeRepoIfneeded(localRepoPath)
    .then(() => {
      this.sync(localRepoPath, remoteRepoUrl)
    })
  }

  clearTmp () {
    this.logger.log('git', `clearing temp files: ${this.storagePath}`)

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
      this.logger.log('git', `push received. Repo: ${push.repo}, branch: ${push.branch} (${push.commit})`)
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
    this.logger.log('git', `mirroring ${remoteRepoUrl} -> ${localRepoPath}`)

    spawn('git', [`--git-dir=${localRepoPath}`, 'fetch', remoteRepoUrl, '+refs/heads/*:refs/heads/*'])
  }
}
