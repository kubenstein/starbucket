const NodeDiscover = require('node-discover');
const GitServer = require('./lib/git-server.js');

const gitServerPort = 7000;
const localReposStoragePath = '.tmp/repos/';

const net = NodeDiscover();

const server = new GitServer({
  port: gitServerPort,
  storagePath: localReposStoragePath,
  dataReceivedCallback: (repoName) => {
    net.send('update-available', {repoName: repoName});
  }
});

net.on('promotion', () => {
  console.log('I was promoted to a master.');

  net.leave('update-available');
  server.start()
  .then(() => {
    console.log('http git server started');
  });
});

net.on('demotion', () => {
  console.log('I was demoted from being a master.');
  server.stop()
  .then(() => {
    console.log('http git server stopped');
  });
});

net.on('master', (obj) => {
  console.log('A new master is in control');
  const newGitMasterServerIp = obj.address;

  net.join('update-available', (data) => {
    server.mirrorRepo(newGitMasterServerIp, data.repoName);
  });
});

net.on('added', (obj) => {
  console.log('A new node has been added.');
});

net.on('removed', (obj) => {
  console.log('A node has been removed.');
});
