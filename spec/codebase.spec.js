'use strict'

const spawn = require('child_process').spawn

describe('Starbucket Codebase', function () {
  this.timeout(20000)

  it('follows JS Standard code style', (done) => {
    let errorHappened = false
    let output = ''
    const proccess = spawn('npm', ['run', 'dev:linter'])
    proccess.on('exit', () => { errorHappened ? done(output) : done() })
    proccess.stdout.on('data', (data) => { output += data })
    proccess.stderr.on('data', (data) => { errorHappened = true })
  })
})
