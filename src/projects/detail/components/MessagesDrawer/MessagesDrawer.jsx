import React, { Component } from 'react'
import PT from 'prop-types'
import Drawer from 'appirio-tech-react-components/components/Drawer/Drawer'
import Toolbar from 'appirio-tech-react-components/components/Toolbar/Toolbar'
import ToolbarGroup from 'appirio-tech-react-components/components/Toolbar/ToolbarGroup'
import ToolbarTitle from 'appirio-tech-react-components/components/Toolbar/ToolbarTitle'
import CloseIcon from 'appirio-tech-react-components/components/Icons/CloseIcon'

import spinnerWhileLoading from '../../../../components/LoadingSpinner'
import SingleFeedContainer from '../../containers/SingleFeedContainer'
import './MessagesDrawer.scss'


// This handles showing a spinner while the state is being loaded async
const enhance = spinnerWhileLoading(props => !props.processing)
const EnhancedSingleFeedContainer = enhance(SingleFeedContainer)

class MessagesDrawer extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const {
      feed,
      currentUser,
      allMembers,
      projectMembers,
      currentMemberRole,
      onRequestChange,
    } = this.props
    return (
      <Drawer {...this.props}>
        <Toolbar style={{position: 'relative', zIndex: 3}}>
          <ToolbarGroup>
            <ToolbarTitle text="Project Scope" />
          </ToolbarGroup>
          <ToolbarGroup>
            <span styleName="close-btn" onClick={() => {onRequestChange(false)}}>
              <CloseIcon />
            </span>
          </ToolbarGroup>
        </Toolbar>
        <div styleName="drawer-content">
          {(
            <EnhancedSingleFeedContainer
              {...{
                ...feed,
                allowComments: feed && feed.allowComments && !!currentMemberRole,
                currentUser,
                allMembers,
                projectMembers,
                onNewCommentChange: this.props.onNewCommentChange,
                onAddNewComment: this.props.onAddNewComment,
                onLoadMoreComments: this.props.onShowAllComments,
                onEditMessage: this.props.onEditMessage,
                onSaveMessageChange: this.props.onSaveMessageChange,
                onSaveMessage: this.props.onSaveMessage,
                onDeleteMessage: this.props.onDeleteMessage,
                onEditTopic: this.props.onEditTopic,
                onTopicChange: this.props.onTopicChange,
                onSaveTopic: this.props.onSaveTopic,
                onDeleteTopic: this.props.onDeleteTopic,
                onEnterFullscreenClick: this.props.enterFullscreen
              }}
            />
          )}
        </div>
      </Drawer>
    )
  }
}

MessagesDrawer.defaultProps = {
}

MessagesDrawer.propTypes = {
  className: PT.string, // The CSS class name of the root element.
  containerClassName: PT.string, // The CSS class name of the container element.
  containerStyle: PT.object, // Override the inline-styles of the container element.
  disableSwipeToOpen: PT.bool, // If true, swiping sideways when the `Drawer` is closed will not open it.
  docked: PT.bool, // If true, the `Drawer` will be docked. In this state, the overlay won't show and clicking on a menu item will not close the `Drawer`.
  onRequestChange: PT.func, // Callback function fired when the `open` state of the `Drawer` is requested to be changed.
  open: PT.bool, // If true, the `Drawer` is opened.  Providing a value will turn the `Drawer` into a controlled component.
  openSecondary: PT.bool, //  If true, the `Drawer` is positioned to open from the opposite side.
  overlayClassName: PT.string, // The CSS class name to add to the `Overlay` component that is rendered behind the `Drawer`.
  overlayStyle: PT.object, // Override the inline-styles of the `Overlay` component that is rendered behind the `Drawer`.
  style: PT.object, // Override the inline-styles of the root element.
  swipeAreaWidth: PT.number, // The width of the left most (or right most) area in pixels where the `Drawer` can be
  width: PT.oneOfType([
    PT.string,
    PT.number
  ]),
  zDepth: PT.number, // The zDepth of the `Drawer`.

  processing: PT.bool.isRequired,
  feed: PT.object,
  currentUser: PT.object,
  allMembers: PT.object.isRequired,
  projectMembers: PT.object.isRequired,
  currentMemberRole: PT.string,
  onNewCommentChange: PT.func.isRequired,
  onAddNewComment: PT.func.isRequired,
  onShowAllComments: PT.func.isRequired,
  onEditMessage: PT.func.isRequired,
  onSaveMessageChange: PT.func.isRequired,
  onSaveMessage: PT.func.isRequired,
  onDeleteMessage: PT.func.isRequired,
  onEditTopic: PT.func.isRequired,
  onTopicChange: PT.func.isRequired,
  onSaveTopic: PT.func.isRequired,
  onDeleteTopic: PT.func.isRequired,
  enterFullscreen: PT.func.isRequired
}

export default MessagesDrawer
