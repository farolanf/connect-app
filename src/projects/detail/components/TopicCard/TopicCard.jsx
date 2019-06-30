import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'

import { singlePluralFormatter } from '../../../../helpers/'

import UiBellIcon from '../../../../assets/icons/ui-bell.svg'
import InvisibleIcon from '../../../../assets/icons/invisible-12.svg'
import FileIcon from '../../../../assets/icons/file-12.svg'
import LinkIcon from '../../../../assets/icons/link-12.svg'

import './TopicCard.scss'

const TopicCard = ({
  variant,
  title,
  avatarUrl,
  lastMsgAuthorName,
  newMsgCount,
  date,
  fileCount,
  linkCount,
  isPrivate
}) => (
  <div styleName="container">
    <div styleName="avatar">
      {avatarUrl && <img src={avatarUrl} />}
      {!avatarUrl && variant === 'new-message' && <UiBellIcon styleName="crimson-icon" />}
    </div>
    <div styleName="body">
      <div styleName="title">
        {isPrivate && <InvisibleIcon styleName="private-icon" />}
        {title}
      </div>
      {variant === 'message' && (
        <div styleName="message-status">Last message {moment(date).format('MMMM D')} by <span styleName="author-name">{lastMsgAuthorName}</span></div>
      )}
      {variant === 'new-message' && (
        <div styleName="new-message-status">{singlePluralFormatter(newMsgCount, 'new messsage')} from {moment(date).format('MMMM D')}</div>
      )}
    </div>
    <div styleName="info">
      {!!fileCount && (
        <div styleName="info-item">
          <FileIcon styleName="info-item-icon" />
          {singlePluralFormatter(fileCount, 'file')}
        </div>
      )}
      {!!linkCount && (
        <div styleName="info-item">
          <LinkIcon styleName="info-item-icon" />
          {singlePluralFormatter(linkCount, 'link')}
        </div>
      )}
      {isPrivate && <span styleName="info-item private-text">Topcoder only</span>}
    </div>
  </div>
)

TopicCard.defaultProps = {
  variant: 'message'
}

TopicCard.propTypes = {
  variant: PropTypes.oneOf(['message', 'new-message']),
  title: PropTypes.string,

  // Only relevant if variant === 'message'
  avatarUrl: PropTypes.string,
  lastMsgAuthorName: PropTypes.string,

  // Only relevant if variant === 'new-message'
  newMsgCount: PropTypes.number,

  // Latest message date if variant === 'message'.
  // Earliest date of new messages if variant === 'new-message'.
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  
  fileCount: PropTypes.number, 
  linkCount: PropTypes.number,
  isPrivate: PropTypes.bool
}

export default TopicCard