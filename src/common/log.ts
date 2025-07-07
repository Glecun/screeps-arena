import ansiStyles from 'ansi-styles'
import { getCpuTime } from 'game/utils'
import log from 'loglevel'
import prefix from 'loglevel-plugin-prefix'

export function initializeLog() {
  const levelColors = new Map<string, string>([
    ['TRACE', `${ansiStyles.magenta.open}TRACE${ansiStyles.magenta.close}`],
    ['DEBUG', `${ansiStyles.blue.open}DEBUG${ansiStyles.blue.close}`],
    ['INFO', `${ansiStyles.cyan.open}INFO ${ansiStyles.cyan.close}`],
    ['WARN', `${ansiStyles.yellow.open}WARN ${ansiStyles.yellow.close}`],
    ['ERROR', `${ansiStyles.red.open}ERROR${ansiStyles.red.close}`],
  ])

  let previousLogTime = 0

  function logTimeFormatter(time: number) {
    const sec = Math.floor(time / 1_000_000_000).toFixed(0)
    const ms = Math.floor((time / 1_000_000) % 1000)
      .toFixed(0)
      .padStart(3, '0')
    const us = Math.floor((time / 1000) % 1000)
      .toFixed(0)
      .padStart(3, '0')
    const ns = Math.floor(time % 1000)
      .toFixed(0)
      .padStart(3, '0')
    return `${sec}.${ms}_${us}_${ns}`
  }

  prefix.reg(log)

  prefix.apply(log, {
    timestampFormatter(date) {
      return `${date.getHours().toFixed(0).padStart(2, '0')}:${date.getMinutes().toFixed(0).padStart(2, '0')}:${date
        .getSeconds()
        .toFixed(0)
        .padStart(2, '0')}.${date.getMilliseconds().toFixed(0).padStart(3, '0')}`
    },
    format(level, name, _timestamp) {
      const levelString = levelColors.get(level.toUpperCase()) ?? level
      const nameLength = 16
      const nameString = `${ansiStyles.green.open}${
        name ? (name.length <= nameLength ? name.padEnd(nameLength) : `${name.slice(0, nameLength - 2)}..`) : 'default'
      }${ansiStyles.green.close}`
      const cpuTime = getCpuTime()
      const timeString = logTimeFormatter(cpuTime)

      if (cpuTime < previousLogTime) {
        previousLogTime = 0
      }
      const duration = cpuTime - previousLogTime
      const timeStyle = duration > 1_000_000 ? ansiStyles.magenta : ansiStyles.gray
      previousLogTime = cpuTime
      const durationString = `${(duration / 1_000_000).toFixed(6)}ms`

      return `${timeStyle.open}[${timeString}] (${durationString})${timeStyle.close} ${levelString} ${nameString}:`
    },
  })
  log.setDefaultLevel('INFO')
}
