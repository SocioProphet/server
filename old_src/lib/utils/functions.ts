import fs from 'fs'
import { config } from '../config'
import { logger } from '../logger'
import { Revision } from '../models'
import { realtime, State } from '../realtime'

/*
Converts a map from string to something into a plain JS object for transmitting via a websocket
 */
export function mapToObject<T> (map: Map<string, T>): object {
  return Array.from(map).reduce((obj, [key, value]) => {
    obj[key] = value
    return obj
  }, {})
}

export function getImageMimeType (imagePath: string): string | undefined {
  const fileExtension = /[^.]+$/.exec(imagePath)
  switch (fileExtension?.[0]) {
    case 'bmp':
      return 'image/bmp'
    case 'gif':
      return 'image/gif'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'tiff':
      return 'image/tiff'
    case 'svg':
      return 'image/svg+xml'
    default:
      return undefined
  }
}

// [Postgres] Handling NULL bytes
// https://github.com/sequelize/sequelize/issues/6485
export function stripNullByte (value: string): string {
  value = '' + value
  // eslint-disable-next-line no-control-regex
  return value ? value.replace(/\u0000/g, '') : value
}

export function processData<T> (data: T, _default: T, process?: (T) => T): T | undefined {
  if (data === undefined) return undefined
  else if (data === null) return _default
  else if (process) return process(data)
  else return data
}

export function handleTermSignals (io): void {
  if (realtime.state === State.Starting) {
    process.exit(0)
  }
  if (realtime.state === State.Stopping) {
    // The function is already running. Do nothing
    return
  }
  logger.info('CodiMD has been killed by signal, try to exit gracefully...')
  realtime.state = State.Stopping
  // disconnect all socket.io clients
  Object.keys(io.sockets.sockets).forEach(function (key) {
    const socket = io.sockets.sockets[key]
    // notify client server going into maintenance status
    socket.emit('maintenance')
    setTimeout(function () {
      socket.disconnect(true)
    }, 0)
  })
  if (config.path) {
    // ToDo: add a proper error handler
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    fs.unlink(config.path, (_) => {
    })
  }
  const checkCleanTimer = setInterval(function () {
    if (realtime.isReady()) {
      Revision.checkAllNotesRevision(function (err, notes) {
        if (err) {
          return logger.error('Error while writing changes to database. We will abort after trying for 30 seconds.\n' + err)
        }
        if (!notes || notes.length <= 0) {
          clearInterval(checkCleanTimer)
          return process.exit(0)
        }
      })
    }
  }, 500)
  setTimeout(function () {
    logger.error('Failed to write changes to database. Aborting')
    clearInterval(checkCleanTimer)
    process.exit(1)
  }, 30000)
}
