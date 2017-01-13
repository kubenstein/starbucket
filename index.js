//
// git commit --allow-empty -m'test'; git push http://localhost:7000/${PWD##*/} master
//

const spawn = require('child_process').spawn;
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
    server.start(() => {
        console.log('http git server started');
    });
    net.leave('update-available');
});

net.on('demotion', () => {
    console.log('I was demoted from being a master.');
    server.stop(() => {
        console.log('http git server stopped');
    });
    net.join('update-available', (data) => {
        // TODO:
        // updateLocalRepo(data);
    });
});

net.on('added', (obj) => {
    console.log('A new node has been added.');
});

net.on('removed', (obj) => {
    console.log('A node has been removed.');
});

net.on('master', (obj) => {
    console.log('A new master is in control');
    const remoteMasterGitServerIp = obj.address;

    net.join('update-available', (data) => {
        updateLocalRepo(data.repoName, remoteMasterGitServerIp);
    });
});

function updateLocalRepo(repoName, remoteRepoIp) {
    console.log('update-available! pulling "'+ repoName +'" from: '+ remoteRepoIp);

    const remoteGitServerPort = gitServerPort;
    const localRepoPath = localReposStoragePath + repoName +'.git/'
    const remote = 'http://'+ remoteRepoIp +':'+ remoteGitServerPort +'/' + repoName;
    const proc = spawn('git', ['--git-dir='+ localRepoPath, 'fetch', remote, '+refs/heads/*:refs/heads/*']);
}