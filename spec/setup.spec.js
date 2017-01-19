const expect = require('chai').expect
const NullLogger = require('./support/null-logger.js')
const gitHelpers = require('./support/git-command-helpers.js')
const Starbucket = require('../lib/starbucket.js')

const fixturesPath = '/tmp/test' + Math.random() + '/reposToTestServers'

const starbucket = new Starbucket({
  gatewayServerPort: 6666,
  gitServerPort: 3333,
  localReposStoragePath: '.tmp/test/node1/repos',
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
      return gitHelpers.pushLocalRepoToStarbucket(starbucket.gatewayServerPort, fixturesPath + '/repoWithAfileToPush')
    }).then(() => {
      return gitHelpers.cloneRepoFromStarbucket(starbucket.gatewayServerPort, fixturesPath + '/clonedRepoWithAFile')
    }).then(() => {
      return gitHelpers.openFile(fixturesPath + '/clonedRepoWithAFile/theFile.txt')
      .then((fileContent) => {
        expect(fileContent).to.be.equal('theFileContent')
      })
    })
    .catch((err) => { return err })
    .then((errOrNull) => {
      starbucket.stop().then(() => {
        done(errOrNull)
      })
    })
  })

  xit('makes git server avaliable when current node is not a Master', () => {
  })

  xit('makes git server avaliable when previous Master node was disconnected', () => {
  })

  xit('makes git server avaliable when previous Master node was disconnected', () => {
  })
})
