const http = require('http');
const spawn = require('child_process').spawn;
const nodeGitServer = require('node-git-server');

class GitServer {
  constructor(params) {
    const port = params.port;
    const storagePath = params.storagePath;
    const dataReceivedCallback = params.dataReceivedCallback;

    this.port = port;
    this.storagePath = storagePath;
    this.server = this.createServer(storagePath, dataReceivedCallback);
  }

  start(successCallbackOrNull) {
    return this.server.listen(this.port, successCallbackOrNull);
  }

  stop(successCallbackOrNull) {
    return this.server.close(successCallbackOrNull);
  }

  mirrorRepo(remoteServerIp, repoName) {
    console.log('update-available! pulling "'+ repoName +'" from: '+ remoteServerIp);

    const remoteGitServerPort = this.port;
    const localRepoPath = this.storagePath + repoName +'.git/'
    const remoteAddress = 'http://'+ remoteServerIp +':'+ remoteGitServerPort +'/' + repoName;

    const proc = spawn('git', ['--git-dir='+ localRepoPath, 'fetch', remoteAddress, '+refs/heads/*:refs/heads/*']);
  }

  // private

  createServer(repoStoragePath, dataReceivedCallback) {
    const gitOperationHandler = nodeGitServer(repoStoragePath);

    gitOperationHandler.on('push', (push) => {
      console.log('push ' + push.repo + '/' + push.commit + ' (' + push.branch + ')');
      push.accept();
      dataReceivedCallback(push.repo);
    });

    return http.createServer((req, res) => {
      gitOperationHandler.handle(req, res);
    });
  }
}


module.exports = GitServer;