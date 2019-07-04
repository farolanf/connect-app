import React, { Component, createElement } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import _ from 'lodash'
import moment from 'moment'

import './Explorer.scss'

const exts = ['aac', 'ai', 'ase', 'asp', 'aspx', 'avi', 'bmp', 'c++', 'cad', 'cfm', 'cgi', 'csh', 'css', 'csv', 'doc', 'docx', 'eps', 'epub', 'exe', 'flash', 'flv', 'font', 'gif', 'gpx', 'gzip', 'html', 'ics', 'iso', 'jar', 'java', 'jpg', 'js', 'jsp', 'log', 'max', 'md', 'mkv', 'mov', 'mp3', 'mp4', 'mpg', 'obj', 'otf', 'pdf', 'php', 'png', 'pptx', 'psd', 'py', 'rar', 'raw', 'rb', 'rss', 'rtf', 'sketch', 'sql', 'srt', 'svg', 'tif', 'tiff', 'ttf', 'txt', 'wav', 'xlsx', 'xml', 'zip', 'default']

const fileIcon = exts.reduce(
  (obj, ext) => {
    obj[ext] = require(`../../../../assets/icons/${ext}.svg`)
    return obj
  },
  {})

const renderIcon = ext => createElement('img', {
  src: fileIcon[ext] ? fileIcon[ext] : fileIcon.default
})

const getExt = name => name.substring(name.lastIndexOf('.') + 1)

/**
 * Descend into the tree and get the entries of the last folder specified by path.
 * @param {*} entries The tree of links and folders
 * @param {*} path The folder path, eg. /dir1/dir2/dir3/dir4
 */
const getEntriesOfPath = (entries, path) => {
  const folders = path.replace(/^\/|\/$/g, '').split('/')
  while (folders.length) {
    const name = folders.shift()
    if (!name) continue
    const entry = _.find(entries, { id: Number(name) })
    if (!entry) return
    entries = entry.children
  }
  return entries
}

const renderDate = date => date ? moment(date).format('MM/DD/YYYY h:mm A') : '—'

class Explorer extends Component {

  constructor(props) {
    super(props)
    this.state = {
      path: ''
    }
  }

  goUp() {
    const { path } = this.state
    const newPath = path.substring(0, path.lastIndexOf('/'))
    this.setState({ path: newPath })
  }

  enterFolder(entry) {
    if (entry.id === -1) return this.goUp()
    const { path } = this.state
    this.setState({ path: [path, entry.id].join('/') })
  }

  renderEntries(entries) {
    // const { loggedInUser } = this.props
    return entries && entries.map((entry, idx) => {
      // const onDeleteConfirm = () => {
      //   onDelete(entry.id)
      //   onDeleteIntent(-1)
      // }
      // const onDeleteCancel = () => onDeleteIntent(-1)
      // const handleDeleteClick = () => onDeleteIntent(idx)

      // const onEditConfirm = (title, allowedUsers) => {
      //   onEdit(entry.id, title, allowedUsers)
      //   onEditIntent(-1)
      // }
      // const onEditCancel = () => onEditIntent(-1)
      // const handleEditClick = () => onEditIntent(idx)
      // const canEdit = `${entry.createdBy}` === `${loggedInUser.userId}`
      const isFolder = entry.id === -1 || Array.isArray(entry.children)
      return (
        <tr key={idx}>
          <td>{renderIcon(getExt(entry.title))}</td>
          <td
            styleName={cn(isFolder && 'folder')}
            onClick={() => isFolder && this.enterFolder(entry)}
          >
            {isFolder ? entry.title : (
              <a href={entry.address}>{entry.title}</a>
            )}
          </td>
          <td>{renderDate(entry.updatedDate)}</td>
          <td>...</td>
        </tr>
      )
    })
  }

  render() {
    const { entries } = this.props
    const { path } = this.state

    return (
      <table styleName="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Modified</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {!!path && this.renderEntries([{ title: '..', id: -1 }])}
          {this.renderEntries(getEntriesOfPath(entries, path))}
        </tbody>
      </table>
    )
  }
}

Explorer.propTypes = {
  entries: PropTypes.array,
  loggedInUser: PropTypes.object.isRequired,
}

export default Explorer