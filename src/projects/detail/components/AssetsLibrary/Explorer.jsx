import React, { Component, createElement } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import _ from 'lodash'
import moment from 'moment'

import Dropdown from 'appirio-tech-react-components/components/Dropdown/Dropdown'
import DropdownItem from 'appirio-tech-react-components/components/Dropdown/DropdownItem'

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
    this.onClickFolder = this.onClickFolder.bind(this)
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

  onClickFolder() {
    document.documentElement.scrollTop = 0
  }

  renderEntries(entries) {
    const { loggedInUser, forFiles, forLinks, linkToEdit, linkToDelete, onEditIntent, onDeleteIntent, onEdit, onDelete, projectMembers } = this.props
    const { path } = this.state
    return entries && entries.map((entry, idx) => {
      const onDeleteConfirm = () => {
        onDelete(entry.id)
        onDeleteIntent(-1)
      }
      const onDeleteCancel = () => onDeleteIntent(-1)
      const handleDeleteClick = () => onDeleteIntent(idx)

      const onEditConfirm = (title, allowedUsers) => {
        onEdit(entry.id, title, allowedUsers)
        onEditIntent(-1)
      }
      const onEditCancel = () => onEditIntent(-1)
      const handleEditClick = () => onEditIntent(idx)
      const canEdit = `${entry.createdBy}` === `${loggedInUser.userId}` && !entry.children && !path
      const isFolder = entry.id === -1 || Array.isArray(entry.children)
      return [
        <tr key={idx}>
          <td>{renderIcon(forFiles ? getExt(entry.title) : fileIcon.default)}</td>
          <td
            styleName={cn(isFolder && 'folder')}
            onClick={() => isFolder && this.enterFolder(entry)}
          >
            {isFolder ?
              <span onClick={this.onClickFolder}>{entry.title}</span>
              : <a href={entry.address}>{entry.title}</a>
            }
          </td>
          <td>{renderDate(entry.updatedDate)}</td>
          <td>
            {canEdit &&
              <Dropdown pointerShadow className="drop-down edit-toggle-container">
                <div className={cn('dropdown-menu-header', 'edit-toggle')} title="Actions">
                  <div styleName="row-menu-btn" />
                </div>
                <div className="dropdown-menu-list down-layer">
                  <ul styleName="dropdown-menu">
                    <DropdownItem item={{ label: 'Edit', val: 'edit' }}
                      onItemClick={handleEditClick}
                      currentSelection=""
                    />
                    <DropdownItem item={{ label: 'Delete', val: 'delete' }}
                      onItemClick={handleDeleteClick}
                      currentSelection=""
                    />
                  </ul>
                </div>
              </Dropdown>
            }
          </td>
        </tr>,
        forFiles && linkToEdit === entry.id &&
          <tr key="edit-file">
            <EditFileAttachment
              attachment={entry}
              projectMembers={projectMembers}
              loggedInUser={loggedInUser}
              onCancel={onEditCancel}
              onConfirm={onEditConfirm}
            />
          </tr>,
        forFiles && linkToDelete === entry.id &&
          <tr key="delete-file">
            <DeleteFileLinkModal
              link={entry}
              onCancel={onDeleteCancel}
              onConfirm={onDeleteConfirm}
            />
          </tr>,
        forLinks && linkToEdit === entry.id &&
        <tr key="edit-link">
          <EditLinkModal
            link={ entry }
            onCancel={ onEditCancel }
            onConfirm={ onEditConfirm }
          />
        </tr>,
        forLinks && linkToDelete === entry.id &&
          <tr key="delete-link">
            <DeleteLinkModal
              link={ entry }
              onCancel={ onDeleteCancel }
              onConfirm={ onDeleteConfirm }
            />
          </tr>,
      ]
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
  loggedInUser: PropTypes.object,
  forFiles: PropTypes.bool,
  forLinks: PropTypes.bool,
}

export default Explorer