import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {Link} from 'react-router-dom'
import _ from 'lodash'
import uncontrollable from 'uncontrollable'

import Panel from '../../../../components/Panel/Panel'
import MobileExpandable from '../../../../components/MobileExpandable/MobileExpandable'
import AddFilePermission from '../../../../components/FileList/AddFilePermissions'
import Explorer from './Explorer'

import {
  FILE_PICKER_API_KEY,
  FILE_PICKER_FROM_SOURCES,
  FILE_PICKER_CNAME,
  FILE_PICKER_SUBMISSION_CONTAINER_NAME
} from '../../../../config/constants'

const FilesExplorer = ({
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

  return (
    <div>
      {pendingAttachments &&
        <AddFilePermission onCancel={discardAttachments}
          onSubmit={onAddingAttachmentPermissions}
          onChange={onChangePermissions}
          selectedUsers={selectedUsers}
          projectMembers={projectMembers}
          loggedInUser={loggedInUser}
          isSharingAttachment={isSharingAttachment}
        />
      }
      <Explorer
        forFiles
        entries={links}
        loggedInUser={loggedInUser}
        projectMembers={projectMembers}
        linkToEdit={linkToEdit}//TODO: continue passing props
        linkToDelete={linkToDelete}
        onDelete={this.removeAttachment}
        onEdit={this.onEditAttachment}
      />
    </div>
  )
}

FilesExplorer.propTypes = {
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

FilesExplorer.defaultProps = {
  limit: 5,
  moreText: 'load more',
  title: 'Links',
}

export default uncontrollable(FilesExplorer, {
  linkToDelete: 'onDeleteIntent',
  linkToEdit: 'onEditIntent',
  isAddingNewLink: 'onAddingNewLink',
  isAddingNewFile: 'isAddingNewFile',
  limit: 'onChangeLimit'
})
