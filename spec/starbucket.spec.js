const expect = require('chai').expect
const NullLogger = require('./support/null-logger.js')
const gitHelpers = require('./support/git-command-helpers.js')
const Starbucket = require('../lib/starbucket.js')

var specTempPath

const starbucket = new Starbucket({
  gatewayServerPort: 1111,
  gitServerPort: 1119,
  localReposStoragePath: '.tmp/test/node1/repos',
  logger: new NullLogger()
})

const otherStarbucketNode = new Starbucket({
  gatewayServerPort: 2222,
  gitServerPort: 2229,
  localReposStoragePath: '.tmp/test/node2/repos',
  logger: new NullLogger()
})

describe('Starbucket', function () {
  this.timeout(20000)

  it('makes git server avaliable when there is only one node', (done) => {
    starbucket.start().then(() => {
      return waitForNodeToBecomeAMaster(starbucket)
    }).then(() => {
      return gitHelpers.pushLocalRepoToStarbucket(starbucket.gatewayServerPort, specTempPath + '/repoWithAfileToPush')
    }).then(() => {
      return gitHelpers.cloneRepoFromStarbucket(starbucket.gatewayServerPort, specTempPath + '/clonedRepoWithAFile')
    }).then(() => {
      return gitHelpers.openFile(specTempPath + '/clonedRepoWithAFile/theFile.txt')
    }).then((fileContent) => {
      expect(fileContent).to.be.equal('theFileContent')
      done()
    })
    .catch((err) => { done(err) })
  })

  it('makes git server avaliable when current node is not a Master', (done) => {
    otherStarbucketNode.start()
    .then(() => {
      return starbucket.start()
    }).then(() => {
      return waitForNodeToBecomeAMaster(otherStarbucketNode)
    }).then(() => {
      return gitHelpers.pushLocalRepoToStarbucket(starbucket.gatewayServerPort, specTempPath + '/repoWithAfileToPush')
    }).then(() => {
      return gitHelpers.cloneRepoFromStarbucket(starbucket.gatewayServerPort, specTempPath + '/clonedRepoWithAFile')
    }).then(() => {
      return gitHelpers.openFile(specTempPath + '/clonedRepoWithAFile/theFile.txt')
    }).then((fileContent) => {
      expect(fileContent).to.be.equal('theFileContent')
      done()
    })
    .catch((err) => { done(err) })
  })

  it('makes git server avaliable when previous Master node disconnects', (done) => {
    otherStarbucketNode.start()
    .then(() => {
      return starbucket.start()
    }).then(() => {
      return waitForNodeToBecomeAMaster(otherStarbucketNode)
    }).then(() => {
      return otherStarbucketNode.stop()
    }).then(() => {
      return waitForNodeToBecomeAMaster(starbucket)
    }).then(() => {
      expect(otherStarbucketNode.isMasterNode()).to.be.false
      expect(starbucket.isMasterNode()).to.be.true
    }).then(() => {
      return gitHelpers.pushLocalRepoToStarbucket(starbucket.gatewayServerPort, specTempPath + '/repoWithAfileToPush')
    }).then(() => {
      return gitHelpers.cloneRepoFromStarbucket(starbucket.gatewayServerPort, specTempPath + '/clonedRepoWithAFile')
    }).then(() => {
      return gitHelpers.openFile(specTempPath + '/clonedRepoWithAFile/theFile.txt')
    }).then((fileContent) => {
      expect(fileContent).to.be.equal('theFileContent')
      done()
    })
    .catch((err) => { done(err) })
  })

  beforeEach(() => {
    specTempPath = '/tmp/test' + Math.random() + '/reposToTestServers'
    return Promise.all([
      otherStarbucketNode.clearTmp(),
      starbucket.clearTmp(),
      gitHelpers.createLocalGitRepoWithData(specTempPath + '/repoWithAfileToPush')
    ])
  })

  afterEach(() => {
    return Promise.all([
      otherStarbucketNode.stop(),
      starbucket.stop()
    ])
  })

  // private

  function waitForNodeToBecomeAMaster (node) {
    function check (node, resolve) {
      if (node.isMasterNode()) return resolve()

      setTimeout(() => {
        check(node, resolve)
      }, 100)
    }
    return new Promise((resolve) => {
      check(node, resolve)
    })
  }
})
