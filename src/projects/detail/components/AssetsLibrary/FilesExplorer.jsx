import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import * as filepicker from 'filestack-js'
import _ from 'lodash'
import uncontrollable from 'uncontrollable'

import Explorer from './Explorer'

import {
  FILE_PICKER_API_KEY,
  FILE_PICKER_FROM_SOURCES,
  FILE_PICKER_CNAME,
  FILE_PICKER_SUBMISSION_CONTAINER_NAME
} from '../../../../config/constants'

const FileLinksMenu = ({
  noDots,
  isAddingNewLink,
  limit,
  links,
  linkToDelete,
  linkToEdit,
  onAddingNewLink,
  onChangeLimit,
  onDelete,
  onDeleteIntent,
  onEdit,
  onEditIntent,
  title,
  moreText,
  withHash,
  attachmentsStorePath,
  category,
  selectedUsers,
  onAddAttachment,
  onUploadAttachment,
  isSharingAttachment,
  discardAttachments,
  onChangePermissions,
  pendingAttachments,
  projectMembers,
  loggedInUser,
  onDeletePostAttachment
}) => {

  const fileUploadClient = filepicker.init(FILE_PICKER_API_KEY, {
    cname: FILE_PICKER_CNAME
  })

  const renderLink = (link) => {
    if (link.onClick) {
      return (
        <a
          href={link.address}
          onClick={(evt) => {
            // we only prevent default on click,
            // as we handle clicks with <li>
            evt.preventDefault()
          }}
        >
          {link.title}
        </a>
      )
    } else if (link.noNewPage) {
      return <Link to={link.address}>{link.title}</Link>
    } else {
      return <a href={link.address} target="_blank" rel="noopener noreferrer">{link.title}</a>
    }
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

  const onAddingAttachmentPermissions = (allowedUsers) => {
    const { attachments, projectId } = pendingAttachments
    _.forEach(attachments, f => {
      const attachment = {
        ...f,
        allowedUsers
      }
      onAddAttachment(projectId, attachment)
    })
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

  return (
    <Explorer entries={links} loggedInUser={loggedInUser} />
  )
}

FileLinksMenu.propTypes = {
  canEdit: PropTypes.bool,
  noDots: PropTypes.bool,
  limit: PropTypes.number,
  links: PropTypes.array.isRequired,
  selectedUsers: PropTypes.string,
  projectMembers: PropTypes.object,
  pendingAttachments: PropTypes.object,
  onUploadAttachment: PropTypes.func,
  isSharingAttachment: PropTypes.bool.isRequired,
  discardAttachments: PropTypes.func,
  onChangePermissions: PropTypes.func,
  attachmentsStorePath: PropTypes.string.isRequired,
  moreText: PropTypes.string,
  onAddingNewLink: PropTypes.func,
  onAddNewLink: PropTypes.func,
  onChangeLimit: PropTypes.func,
  onDelete: PropTypes.func,
  title: PropTypes.string,
  loggedInUser: PropTypes.object.isRequired,
  onDeletePostAttachment: PropTypes.func,
}

FileLinksMenu.defaultProps = {
  limit: 5,
  moreText: 'load more',
  title: 'Links',
}

export default uncontrollable(FileLinksMenu, {
  linkToDelete: 'onDeleteIntent',
  linkToEdit: 'onEditIntent',
  isAddingNewLink: 'onAddingNewLink',
  isAddingNewFile: 'isAddingNewFile',
  limit: 'onChangeLimit'
})
