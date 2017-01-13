//
// git commit --allow-empty -m'test'; git push http://localhost:7000/${PWD##*/} master
//

const http = require('http');
const NodeDiscover = require('node-discover');
var gitserver = require('node-git-server');

const net = NodeDiscover();
const gitHandler = gitserver('.tmp/repos');
let remoteMasterGitServerIp = null;

const server = http.createServer((req, res) => {
    gitHandler.handle(req, res);
});

net.on('promotion', () => {
    console.log('I was promoted to a master.');
    server.listen(7000, () => {
        console.log('http git server started');
    });
    net.leave('update-available');
});

net.on('demotion', () => {
    console.log('I was demoted from being a master.');
    server.close(() => {
        console.log('http git server stopped');
    });
    net.join('update-available', () => {
        console.log('update-available! pulling from: '+ remoteMasterGitServerIp);
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
    remoteMasterGitServerIp = obj.address;

    net.join('update-available', (data) => {
        console.log('update-available! pulling "'+ data.repoName +'" from: '+ remoteMasterGitServerIp);
    });
});

gitHandler.on('push', (push) => {
    console.log('push ' + push.repo + '/' + push.commit + ' (' + push.branch + ')');
    push.accept();
    net.send('update-available', {repoName: push.repo});
});