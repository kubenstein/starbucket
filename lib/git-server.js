const http = require('http');
const nodeGitServer = require('node-git-server');

class GitServer {
  constructor(params) {
    const port = params.port;
    const storagePath = params.storagePath;
    const dataReceivedCallback = params.dataReceivedCallback;

    this.port = port;
    this.server = this.createServer(storagePath, dataReceivedCallback);
  }

  start(successCallbackOrNull) {
    return this.server.listen(this.port, successCallbackOrNull);
  }

  stop(successCallbackOrNull) {
    return this.server.close(successCallbackOrNull);
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