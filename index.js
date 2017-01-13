//
// git commit --allow-empty -m'test'; git push http://localhost:7000/${PWD##*/} master
//

const http = require('http');
const spawn = require('child_process').spawn;
const NodeDiscover = require('node-discover');
var gitserver = require('node-git-server');

const fileServerPort = 7000;
const net = NodeDiscover();
const gitHandler = gitserver('.tmp/repos');

const server = http.createServer((req, res) => {
    gitHandler.handle(req, res);
});

net.on('promotion', () => {
    console.log('I was promoted to a master.');
    server.listen(fileServerPort, () => {
        console.log('http git server started');
    });
    net.leave('update-available');
});

net.on('demotion', () => {
    console.log('I was demoted from being a master.');
    server.close(() => {
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

gitHandler.on('push', (push) => {
    console.log('push ' + push.repo + '/' + push.commit + ' (' + push.branch + ')');
    push.accept();
    net.send('update-available', {repoName: push.repo});
});


function updateLocalRepo(repoName, remoteRepoIp) {
    console.log('update-available! pulling "'+ repoName +'" from: '+ remoteRepoIp);
    const localRepoPath = '.tmp/repos/'+ repoName +'.git/'
    const remote = 'http://'+ remoteRepoIp +':'+ fileServerPort +'/' + repoName;
    const proc = spawn('git', ['--git-dir='+ localRepoPath, 'fetch', remote, '+refs/heads/*:refs/heads/*']);
}