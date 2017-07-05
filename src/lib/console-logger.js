export default class ConsoleLogger {
  log (level, msg) {
    const timeStamp = new Date().toISOString()
    console.log(`[${timeStamp}] ${this.pad(4, level, ' ')} - ${msg}`)
  }

  // private

  pad (width, string, padding) {
    return (width <= string.length) ? string : this.pad(width, padding + string, padding)
  }
}
