import React, { Component, createElement } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import uncontrollable from 'uncontrollable'

import Dropdown from 'appirio-tech-react-components/components/Dropdown/Dropdown'
import DropdownItem from 'appirio-tech-react-components/components/Dropdown/DropdownItem'

import EditFileAttachment from '../../../../components/LinksMenu/EditFileAttachment'
import DeleteFileLinkModal from '../../../../components/LinksMenu/DeleteFileLinkModal'
import EditLinkModal from '../../../../components/LinksMenu/EditLinkModal'
import DeleteLinkModal from '../../../../components/LinksMenu/DeleteLinkModal'

import './Explorer.scss'

const folderId = -1

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

  closeModals() {
    const { onEditIntent, onDeleteIntent } = this.props
    onEditIntent()
    onDeleteIntent()
  }

  goUp() {
    const { path } = this.state
    const newPath = path.substring(0, path.lastIndexOf('/'))
    this.setState({ path: newPath })
    this.closeModals()
  }

  enterFolder(entry) {
    if (entry.id === folderId) return this.goUp()
    const { path } = this.state
    this.setState({ path: [path, entry.id].join('/') })
    this.closeModals()
  }

  onClickFolder() {
    document.documentElement.scrollTop = 0
  }

  renderEntries(entries) {
    const { loggedInUser, forFiles, forLinks, linkToEdit, linkToDelete, onEditIntent, onDeleteIntent, onEdit, onDelete, projectMembers, canManageLinks } = this.props
    const { path } = this.state
    return entries && entries.map(entry => {
      const onDeleteConfirm = () => {
        onDelete(entry.id)
        onDeleteIntent()
      }
      const onDeleteCancel = () => onDeleteIntent()
      const handleDeleteClick = () => {
        this.closeModals()
        onDeleteIntent(entry.id)
      }

      const onEditConfirm = (title, allowedUsers) => {
        onEdit(entry.id, title, allowedUsers)
        onEditIntent()
      }
      const onEditCancel = () => onEditIntent()
      const handleEditClick = () => {
        this.closeModals()
        onEditIntent(entry.id)
      }
      const canEditFiles = forFiles && `${entry.createdBy}` === `${loggedInUser.userId}` && !entry.children && !path
      const canEditLinks = forLinks && canManageLinks && !entry.children && !path
      const canEdit = canEditFiles || canEditLinks
      const isFolder = entry.id === folderId || Array.isArray(entry.children)
      return [
        <tr key={entry.id}>
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
        forFiles && !!linkToEdit && linkToEdit === entry.id &&
          <tr key="edit-file">
            <td colSpan="4">
              <EditFileAttachment
                attachment={entry}
                projectMembers={projectMembers}
                loggedInUser={loggedInUser}
                onCancel={onEditCancel}
                onConfirm={onEditConfirm}
              />
            </td>
          </tr>,
        forFiles && !!linkToDelete && linkToDelete === entry.id &&
          <tr key="delete-file">
            <td colSpan="4">
              <DeleteFileLinkModal
                link={entry}
                onCancel={onDeleteCancel}
                onConfirm={onDeleteConfirm}
              />
            </td>
          </tr>,
        forLinks && linkToEdit >= 0 && linkToEdit === entry.id &&
        <tr key="edit-link">
          <td colSpan="4">
            <EditLinkModal
              link={ entry }
              onCancel={ onEditCancel }
              onConfirm={ onEditConfirm }
            />
          </td>
        </tr>,
        forLinks && linkToDelete >= 0 && linkToDelete === entry.id &&
          <tr key="delete-link">
            <td colSpan="4">
              <DeleteLinkModal
                link={ entry }
                onCancel={ onDeleteCancel }
                onConfirm={ onDeleteConfirm }
              />
            </td>
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
          {!!path && this.renderEntries([{ title: '..', id: folderId }])}
          {this.renderEntries(getEntriesOfPath(entries, path))}
        </tbody>
      </table>
    )
  }
}

Explorer.propTypes = {
  forFiles: PropTypes.bool,
  forLinks: PropTypes.bool,
  entries: PropTypes.array,
  linkToEdit: PropTypes.number,
  linkToDelete: PropTypes.number,
  onEditIntent: PropTypes.func,
  onDeleteIntent: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  loggedInUser: PropTypes.object,
  projectMembers: PropTypes.object,
  canManageLinks: PropTypes.bool,
}

export default uncontrollable(Explorer, {
  linkToDelete: 'onDeleteIntent',
  linkToEdit: 'onEditIntent',
  isAddingNewLink: 'onAddingNewLink',
  isAddingNewFile: 'isAddingNewFile',
  limit: 'onChangeLimit'
})