import { Request, Response } from 'express'
import { config } from '../../config'
import { errors } from '../../errors'
import { logger } from '../../logger'
import { Note } from '../../models'
import * as ActionController from './actions'
import * as NoteUtils from './util'

export function publishNoteActions (req: Request, res: Response): void {
  NoteUtils.findNoteOrCreate(req, res, function (note) {
    const action = req.params.action
    switch (action) {
      case 'download':
        exports.downloadMarkdown(req, res, note)
        break
      case 'edit':
        res.redirect(config.serverURL + '/' + (note.alias ? note.alias : Note.encodeNoteId(note.id)) + '?both')
        break
      default:
        res.redirect(config.serverURL + '/s/' + note.shortid)
        break
    }
  })
}

export function showPublishNote (req: Request, res: Response): void {
  NoteUtils.findNoteOrCreate(req, res, function (note) {
    // force to use short id
    const shortid = req.params.shortid
    if ((note.alias && shortid !== note.alias) || (!note.alias && shortid !== note.shortid)) {
      return res.redirect(config.serverURL + '/s/' + (note.alias || note.shortid))
    }
    note.increment('viewcount').then(function (note) {
      if (!note) {
        return errors.errorNotFound(res)
      }
      NoteUtils.getPublishData(req, res, note, (data) => {
        res.set({
          'Cache-Control': 'private' // only cache by client
        })
        return res.render('pretty.ejs', data)
      })
    }).catch(function (err) {
      logger.error(err)
      return errors.errorInternalError(res)
    })
  })
}

export function showNote (req: Request, res: Response): void {
  NoteUtils.findNoteOrCreate(req, res, function (note) {
    // force to use note id
    const noteId = req.params.noteId
    const id = Note.encodeNoteId(note.id)
    if ((note.alias && noteId !== note.alias) || (!note.alias && noteId !== id)) {
      return res.redirect(config.serverURL + '/' + (note.alias || id))
    }
    const body = note.content
    const extracted = Note.extractMeta(body)
    const meta = Note.parseMeta(extracted.meta)
    let title = Note.decodeTitle(note.title)
    title = Note.generateWebTitle(meta.title || title)
    const opengraph = Note.parseOpengraph(meta, title)
    res.set({
      'Cache-Control': 'private', // only cache by client
      'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
    })
    return res.render('codimd.ejs', {
      title: title,
      opengraph: opengraph
    })
  })
}

export function createFromPOST (req: Request, res: Response): void {
  let body = ''
  if (req.body && req.body.length > config.documentMaxLength) {
    return errors.errorTooLong(res)
  } else if (req.body) {
    body = req.body
  }
  body = body.replace(/[\r]/g, '')
  return NoteUtils.newNote(req, res, body)
}

export function doAction (req: Request, res: Response): void {
  const noteId = req.params.noteId
  NoteUtils.findNoteOrCreate(req, res, (note) => {
    const action = req.params.action
    // TODO: Don't switch on action, choose action in Router and use separate functions
    switch (action) {
      case 'publish':
      case 'pretty': // pretty deprecated
        res.redirect(config.serverURL + '/s/' + (note.alias || note.shortid))
        break
      case 'slide':
        res.redirect(config.serverURL + '/p/' + (note.alias || note.shortid))
        break
      case 'download':
        exports.downloadMarkdown(req, res, note)
        break
      case 'info':
        ActionController.getInfo(req, res, note)
        break
      case 'gist':
        ActionController.createGist(req, res, note)
        break
      case 'revision':
        ActionController.getRevision(req, res, note)
        break
      default:
        return res.redirect(config.serverURL + '/' + noteId)
    }
  })
}

export function downloadMarkdown (req: Request, res: Response, note): void {
  const body = note.content
  let filename = Note.decodeTitle(note.title)
  filename = encodeURIComponent(filename)
  res.set({
    'Access-Control-Allow-Origin': '*', // allow CORS as API
    'Access-Control-Allow-Headers': 'Range',
    'Access-Control-Expose-Headers': 'Cache-Control, Content-Encoding, Content-Range',
    'Content-Type': 'text/markdown; charset=UTF-8',
    'Cache-Control': 'private',
    'Content-disposition': 'attachment; filename=' + filename + '.md',
    'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
  })
  res.send(body)
}
