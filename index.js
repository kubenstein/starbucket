const NodeDiscover = require('node-discover');
const GitServer = require('./lib/git-server.js');
const GatewayServer = require('./lib/proxy-server.js');

const gatewayServerPort = process.env.GATEWAY_PORT || 7070;
const gitServerPort = process.env.GIT_SERVER_PORT || 7000;
const localReposStoragePath = '.tmp/repos/';

const net = NodeDiscover();
const gitServer = new GitServer({
  port: gitServerPort,
  storagePath: localReposStoragePath,
  dataReceivedCallback: (repoName) => {
    net.send('update-available', {repoName: repoName});
  }
});
const gatewayServer = new GatewayServer(gatewayServerPort);
gatewayServer.restartWithTargetUrl('http://localhost:'+ gitServerPort);

net.on('promotion', () => {
  console.log('I was promoted to a master.');

  net.leave('update-available');
  gitServer.start()
  .then(() => {
    console.log('local http git server started');
  })
  .then(() => {
    gatewayServer.restartWithTargetUrl('http://localhost:'+ gitServerPort);
  });
});

net.on('demotion', () => {
  console.log('I was demoted from being a master.');
  gitServer.stop()
  .then(() => {
    console.log('local http git server stopped');
  });
});

net.on('master', (obj) => {
  console.log('A new master is in control');
  const newGitMasterServerIp = obj.address;
  gatewayServer.restartWithTargetUrl('http://'+ newGitMasterServerIp +':'+ gitServerPort);

  net.join('update-available', (data) => {
    gitServer.mirrorRepo(gatewayServer.getTargetUrl(), data.repoName);
  });
});

net.on('added', (obj) => {
  console.log('A new node has been added.');
});

net.on('removed', (obj) => {
  console.log('A node has been removed.');
});
