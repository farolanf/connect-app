import React, { Component, createElement } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import _ from 'lodash'

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
 * Descend into tree of folders and get the entries of the last folder specified by path.
 * @param {*} root The tree of files and folders
 * @param {*} path The folder path, eg. /dir1/dir2/dir3/dir4
 */
const getEntriesOfPath = (root, path) => {
  const folders = path.replace(/^\/|\/$/g, '').split('/')
  let node = root
  while (folders.length) {
    const name = folders.shift()
    if (!name) continue
    const folderNode = _.find(node.entries, { name, isFolder: true })
    if (!folderNode) return
    node = folderNode
  }
  return node.entries
}

const processUploadedFiles = (fpFiles, category) => {
  const attachments = []
  onAddingNewLink(false)
  fpFiles = _.isArray(fpFiles) ? fpFiles : [fpFiles]
  _.forEach(fpFiles, f => {
    const attachment = {
      title: f.filename,
      description: '',
      category,
      size: f.size,
      filePath: f.key,
      contentType: f.mimetype || 'application/unknown'
    }
    attachments.push(attachment)
  })
  onUploadAttachment(attachments)
}

const openFileUpload = () => {
  if (fileUploadClient) {
    const picker = fileUploadClient.picker({
      storeTo: {
        location: 's3',
        path: attachmentsStorePath,
        container: FILE_PICKER_SUBMISSION_CONTAINER_NAME,
        region: 'us-east-1'
      },
      maxFiles: 4,
      fromSources: FILE_PICKER_FROM_SOURCES,
      uploadInBackground: false,
      onFileUploadFinished: (files) => {
        processUploadedFiles(files, category)
      },
      onOpen: () => {
        onAddingNewLink(true)
      },
      onClose: () => {
        onAddingNewLink(false)
      }
    })

    picker.open()
  }
}

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

  enterFolder(name) {
    if (name === '..') return this.goUp()
    const { path } = this.state
    this.setState({ path: [path, name].join('/') })
  }

  renderEntries(entries) {
    return entries && entries.map((item, i) => (
      <tr key={i}>
        <td>{renderIcon(getExt(item.name))}</td>
        <td
          styleName={cn(item.isFolder && 'folder')}
          onClick={() => item.isFolder && this.enterFolder(item.name)}
        >
          {item.name}
        </td>
        <td>{item.modified || '—'}</td>
        <td>...</td>
      </tr>
    ))
  }

  render() {
    const { root } = this.props
    const { path } = this.state
    return (
      <table styleName="table">
        <thead>
          <tr>
            <th>Type</th>
            <th styleName="active desc">Name</th>
            <th>Modified</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {!!path && this.renderEntries([
            { name: '..', isFolder: true }
          ])}
          {this.renderEntries(getEntriesOfPath(root, path))}
        </tbody>
      </table>
    )
  }
}

Explorer.propTypes = {
  root: PropTypes.shape({
    entries: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.node,
      isFolder: PropTypes.bool,
      modified: PropTypes.node,
      entries: PropTypes.array,
    })),
  }),
}

export default Explorer