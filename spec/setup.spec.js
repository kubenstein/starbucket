const expect = require('chai').expect
const NullLogger = require('./support/null-logger.js')
const gitHelpers = require('./support/git-command-helpers.js')
const Starbucket = require('../lib/starbucket.js')

const fixturesPath = '/tmp/test' + Math.random() + '/reposToTestServers'

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
  this.timeout(10000)

  it('makes git server avaliable when there is only one node', (done) => {
    starbucket.clearTmp().then(() => {
      return starbucket.start()
    }).then(() => {
      return gitHelpers.createLocalGitRepoWithData(fixturesPath + '/repoWithAfileToPush')
    }).then(() => {
      expect(starbucket.isMasterNode()).to.be.true
      return gitHelpers.pushLocalRepoToStarbucket(starbucket.gatewayServerPort, fixturesPath + '/repoWithAfileToPush')
    }).then(() => {
      return gitHelpers.cloneRepoFromStarbucket(starbucket.gatewayServerPort, fixturesPath + '/clonedRepoWithAFile')
    }).then(() => {
      return gitHelpers.openFile(fixturesPath + '/clonedRepoWithAFile/theFile.txt')
    }).then((fileContent) => {
      expect(fileContent).to.be.equal('theFileContent')
    })
    .catch((err) => { return err })
    .then((errOrNull) => {
      starbucket.stop().then(() => {
        done(errOrNull)
      })
    })
  })

  it('makes git server avaliable when current node is not a Master', (done) => {
    otherStarbucketNode.clearTmp().then(() => {
      return otherStarbucketNode.start()
    }).then(() => {
      return starbucket.clearTmp()
    }).then(() => {
      return starbucket.start()
    }).then(() => {
      return gitHelpers.createLocalGitRepoWithData(fixturesPath + '/repoWithAfileToPush')
    }).then(() => {
      expect(otherStarbucketNode.isMasterNode()).to.be.true
      expect(starbucket.isMasterNode()).to.be.false
      return gitHelpers.pushLocalRepoToStarbucket(starbucket.gatewayServerPort, fixturesPath + '/repoWithAfileToPush')
    }).then(() => {
      return gitHelpers.cloneRepoFromStarbucket(starbucket.gatewayServerPort, fixturesPath + '/clonedRepoWithAFile')
    }).then(() => {
      return gitHelpers.openFile(fixturesPath + '/clonedRepoWithAFile/theFile.txt')
    }).then((fileContent) => {
      expect(fileContent).to.be.equal('theFileContent')
    })
    .catch((err) => { return err })
    .then((errOrNull) => {
      starbucket.stop().then(() => {
        done(errOrNull)
      })
    })
  })

  xit('makes git server avaliable when previous Master node was disconnected', (done) => {
  })

  xit('makes git server avaliable when previous Master node was disconnected', () => {
  })
})
