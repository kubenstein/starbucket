const spawn = require('child_process').spawn
const fs = require('fs')

exports.createLocalGitRepoWithData = (path) => {
  return new Promise((resolve) => {
    spawn('git', ['init', path]).on('exit', resolve)
  })
  .then(() => {
    return new Promise((resolve) => {
      fs.writeFile(path + '/theFile.txt', 'theFileContent', resolve)
    })
  })
  .then(() => {
    return new Promise((resolve) => {
      spawn('git', ['--git-dir=' + path + '/.git', '--work-tree=' + path, 'add', '-A']).on('exit', resolve)
    })
  })
  .then(() => {
    return new Promise((resolve) => {
      spawn('git', ['--git-dir=' + path + '/.git', '--work-tree=' + path, 'commit', '-am', 'addedTheFile']).on('exit', resolve)
    })
  })
}

exports.pushLocalRepoToStarbucket = (nodeGatewayPort, path) => {
  return new Promise((resolve) => {
    spawn('git', ['--git-dir=' + path + '/.git', '--work-tree=' + path, 'push', 'http://localhost:' + nodeGatewayPort + '/theRepo', 'master']).on('exit', resolve)
  })
}

exports.cloneRepoFromStarbucket = (nodeGatewayPort, path) => {
  return new Promise((resolve) => {
    spawn('git', ['clone', 'http://localhost:' + nodeGatewayPort + '/theRepo', path]).on('exit', resolve)
  })
}

exports.openFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, contents) => {
      if (err) return reject(err)
      resolve(contents)
    })
  })
}
