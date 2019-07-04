import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import * as filepicker from 'filestack-js'

import {
  FILE_PICKER_API_KEY,
  FILE_PICKER_FROM_SOURCES,
  FILE_PICKER_CNAME,
  FILE_PICKER_SUBMISSION_CONTAINER_NAME,
  PROJECT_ATTACHMENTS_FOLDER,
} from '../../../../config/constants'

import Explorer from './Explorer'
import './AssetsLibrary.scss'

const fileUploadClient = filepicker.init(FILE_PICKER_API_KEY, {
  cname: FILE_PICKER_CNAME
})

const TabButton = ({ label, badge, active, ...props }) => (
  <div styleName={cn('tab-btn', active && 'active')} {...props}>
    {label}
    {badge && <span styleName={cn('badge', active && 'active')}>{badge}</span>}
  </div>
)

class AssetsLibrary extends Component {

  constructor(props) {
    super(props)
    this.state = {
      selectedTab: 'files'
    }
    this.openFileUpload = this.openFileUpload.bind(this)
  }

  processUploadedFiles(fpFiles, category) {
    const { onAddingNewLink, onUploadAttachment } = this.props
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

  openFileUpload() {
    const { project, onAddingNewLink, category } = this.props
    const attachmentsStorePath = `${PROJECT_ATTACHMENTS_FOLDER}/${project.id}/`
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
          this.processUploadedFiles(files, category)
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

  createSelectTab(tabId) {
    return () => this.setState({ selectedTab: tabId })
  }

  render() {
    const { selectedTab } = this.state

    return (
      <div styleName="root">
        <div styleName="header">
          <h1 styleName="title">Asset Library</h1>
          <button
            className="tc-btn tc-btn-primary tc-btn-sm action-btn"
            onClick={this.openFileUpload}
          >
            Add New...
          </button>
        </div>
        <div styleName="tabs">
          <TabButton
            label="Files"
            badge="45"
            active={selectedTab === 'files'}
            onClick={this.createSelectTab('files')}
          />
          <TabButton
            label="Links"
            badge="1548"
            active={selectedTab === 'links'}
            onClick={this.createSelectTab('links')}
          />
        </div>
        <h2 styleName="section-title">
          {selectedTab === 'files' && 'All Files'}
          {selectedTab === 'links' && 'All Links'}
        </h2>
        <div styleName="section">
          {selectedTab === 'files' &&
            <Explorer root={{
              entries: [
                { name: 'file1.xlsx' },
                { name: 'file2.png' },
                { name: 'dir1', isFolder: true, entries: [
                  { name: 'file3.txt' },
                  { name: 'file4.txt' },
                ] },
                { name: 'dir2', isFolder: true, entries: [
                  { name: 'img1.jpg' },
                  { name: 'img2.jpg' },
                ] },
                { name: 'file5.mp4' },
                { name: 'file6.docx' },
                { name: 'file7.pdf' },
              ]
            }}
            />
          }
        </div>
      </div>
    )
  }
}

AssetsLibrary.propTypes = {
  project: PropTypes.object.isRequired,
}

export default AssetsLibrary