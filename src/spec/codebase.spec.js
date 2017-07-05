'use strict'

const exec = require('child_process').exec

describe('Starbucket Codebase', function () {
  this.timeout(20000)

  it('follows JS Standard code style', (done) => {
    exec('npm run dev:linter', (error, stdout) => {
      error ? done(stdout) : done()
    })
  })
})
