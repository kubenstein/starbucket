const fs = require('fs')

const srcDir = __dirname
const rootDir = `${srcDir}/../`

// taken from http://jlongster.com/Backend-Apps-with-Webpack--Part-I
const nodeModules = {}
fs.readdirSync('node_modules')
  .filter((x) => {
    return ['.bin'].indexOf(x) === -1
  })
  .forEach((mod) => {
    nodeModules[mod] = `commonjs ${mod}`
  })

module.exports = {
  entry: `${srcDir}/lib/starbucket.js`,
  target: 'node',
  node: {
    __dirname: false,
    __filename: false
  },
  output: {
    path: `${rootDir}/dist/`,
    publicPath: '/',
    filename: 'starbucket.js',
    library: 'starbucket',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },

  module: {
    loaders: [
      {
        test: /(\.js)$/,
        loader: 'babel',
        query: {
          presets: ['stage-0', 'es2015']
        }
      }
    ]
  },

  resolve: {
    root: [
      srcDir,
      rootDir
    ]
  },

  externals: nodeModules
}
