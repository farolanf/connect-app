/**
 * MessagesContainer container
 * displays content of the Dashboard tab
 *
 * NOTE data is loaded by the parent ProjectDetail component
 */
import React from 'react'
import _ from 'lodash'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import update from 'react-addons-update'

import {
  filterReadNotifications,
  filterNotificationsByProjectId,
  filterProjectNotifications,
  preRenderNotifications,
} from '../../../routes/notifications/helpers/notifications'

import { toggleNotificationRead, toggleBundledNotificationRead } from '../../../routes/notifications/actions'

import { loadDashboardFeeds, loadProjectMessages, saveProjectTopic, deleteProjectTopic, loadFeedComments, addFeedComment, saveFeedComment, deleteFeedComment, getFeedComment } from '../../actions/projectTopics'

import MediaQuery from 'react-responsive'
import MessagesFeedContainer from './MessagesFeedContainer'
import Sticky from '../../../components/Sticky'
import { SCREEN_BREAKPOINT_MD } from '../../../config/constants'
import TwoColsLayout from '../../../components/TwoColsLayout'
import SystemFeed from '../../../components/Feed/SystemFeed'
import MessagesDrawer from '../components/MessagesDrawer'
import NotificationsReader from '../../../components/NotificationsReader'
import { checkPermission } from '../../../helpers/permissions'
import PERMISSIONS from '../../../config/permissions'
import { sortFeedByNewestMsg } from '../../../helpers/feeds'

import { isSystemUser } from '../../../helpers/tcHelpers'

import {
  THREAD_MESSAGES_PAGE_SIZE,
  CONNECT_USER,
  CODER_BOT_USERID,
  CODER_BOT_USER,
  PROJECT_FEED_TYPE_PRIMARY,
  PROJECT_FEED_TYPE_MESSAGES,
  EVENT_TYPE,
} from '../../../config/constants'

class MessagesContainer extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      open: false,
      feed: null,
      feeds: [],
      showAll: []
    }
    this.onLeave = this.onLeave.bind(this)
    this.isChanged = this.isChanged.bind(this)
    this.onNotificationRead = this.onNotificationRead.bind(this)
    this.toggleDrawer = this.toggleDrawer.bind(this)
    this.onNewCommentChange = this.onNewCommentChange.bind(this)
    this.onAddNewComment = this.onAddNewComment.bind(this)
    this.onShowAllComments = this.onShowAllComments.bind(this)
    this.onEditMessage = this.onEditMessage.bind(this)
    this.onSaveMessageChange = this.onSaveMessageChange.bind(this)
    this.onSaveMessage = this.onSaveMessage.bind(this)
    this.onDeleteMessage = this.onDeleteMessage.bind(this)
    this.onEditTopic = this.onEditTopic.bind(this)
    this.onTopicChange = this.onTopicChange.bind(this)
    this.onSaveTopic = this.onSaveTopic.bind(this)
    this.onDeleteTopic = this.onDeleteTopic.bind(this)
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.onLeave)
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onLeave)
  }

  componentWillMount() {
    const { isFeedsLoading, feeds } = this.props

    this.init(this.props)

    // load feeds from dashboard if they are not currently loading or loaded yet
    // also it will load feeds, if we already loaded them, but it was 0 feeds before
    if (!isFeedsLoading && feeds.length < 1) {
      this.loadAllFeeds()
    }
  }

  componentWillReceiveProps(nextProps) {
    this.init(nextProps, this.props)
  }

  // Notify user if they navigate away while the form is modified.
  onLeave(e = {}) {
    if (this.isChanged()) {
      return e.returnValue = 'You haven\'t posted your message. If you leave this page, your message will not be saved. Are you sure you want to leave?'
    }
  }

  isChanged() {
    const { newPost } = this.state
    const hasComment = !_.isUndefined(_.find(this.state.feeds, (feed) => (feed.isSavingTopic || feed.isDeletingTopic || feed.isAddingComment)
      || (feed.newComment && feed.newComment.length)
      || (feed.newTitle && feed.newTitle.length && feed.newTitle !== feed.title)
      || (feed.topicMessage && feed.topicMessage.newContent && feed.topicMessage.newContent.length && feed.topicMessage.rawContent && feed.topicMessage.newContent !== feed.topicMessage.rawContent)
      || !_.isUndefined(_.find(feed.comments, (message) => message.isSavingComment || message.isDeletingComment || (message.newContent && message.newContent.length && message.rawContent && message.newContent !== message.rawContent)))
    ))
    const hasThread = (newPost.title && !!newPost.title.trim().length) || ( newPost.content && !!newPost.content.trim().length)
    return hasThread || hasComment
  }
  
  init(props, prevProps) {
    const { match, feeds } = props

    let resetNewPost = false
    if (prevProps) {
      resetNewPost = prevProps.isCreatingFeed && !props.isCreatingFeed && !props.error
    }

    const mappedFeeds = feeds.map((feed) => {
      // finds the same feed from previous props, if exists
      let prevFeed
      if (prevProps && prevProps.feeds) {
        prevFeed = _.find(prevProps.feeds, f => feed.id === f.id)
      }
      // reset new comment if we were adding comment and there is no error in doing so
      const resetNewComment = prevFeed && prevFeed.isAddingComment && !feed.isAddingComment && !feed.error
      return this.mapFeed(feed, this.state.showAll.indexOf(feed.id) > -1, resetNewComment, prevProps)
    }).filter(item => item)

    this.setState({
      newPost: resetNewPost ? {} : this.state.newPost,
      feeds: mappedFeeds
    })

    // open messages drawer if there's corresponding path param
    if (match.params.topicId) {
      const topicId = Number(match.params.topicId)
      const feed = _.find(mappedFeeds, { id: topicId })
      this.setState({ feed, open: true })
    } else {
      this.setState({ open: false })
    }
  }

  mapFeed(feed, showAll = false, resetNewComment = false, prevProps) {
    const { allMembers, project, currentMemberRole } = this.props
    const item = _.pick(feed, ['id', 'date', 'read', 'tag', 'title', 'totalPosts', 'userId', 'reference', 'referenceId', 'postIds', 'isSavingTopic', 'isDeletingTopic', 'isAddingComment', 'isLoadingComments', 'error'])
    // Github issue##623, allow comments on all posts (including system posts)
    item.allowComments = true
    if (isSystemUser(item.userId)) {
      item.user = CODER_BOT_USER
    } else {
      item.user = allMembers[item.userId]
    }
    item.unread = !feed.read && !!currentMemberRole
    item.totalComments = feed.totalPosts
    item.comments = []
    let prevFeed = null
    if (prevProps) {
      prevFeed = _.find(prevProps.feeds, t => feed.id === t.id)
    }
    const _toComment = (p) => {
      const date = p.updatedDate?p.updatedDate:p.date
      const edited = date !== p.date
      const commentAuthor = allMembers[p.userId] ? allMembers[p.userId] : { ...CONNECT_USER, userId: p.userId }
      const comment = {
        id: p.id,
        content: p.body,
        rawContent: p.rawContent,
        isGettingComment: p.isGettingComment,
        isSavingComment: p.isSavingComment,
        isDeletingComment: p.isDeletingComment,
        error: p.error,
        unread: !p.read && !!currentMemberRole,
        date,
        createdAt: p.date,
        edited,
        author: isSystemUser(p.userId) ? CODER_BOT_USER : commentAuthor,
        attachments: p.attachments || []
      }
      const prevComment = prevFeed ? _.find(prevFeed.posts, t => p.id === t.id) : null
      if (prevComment && prevComment.isSavingComment && !comment.isSavingComment && !comment.error) {
        comment.editMode = false
      } else {
        const feedFromState = _.find(this.state.feeds, t => feed.id === t.id)
        const commentFromState = feedFromState ? _.find(feedFromState.comments, t => comment.id === t.id) : null
        comment.newContent = commentFromState ? commentFromState.newContent : null
        comment.editMode = commentFromState && commentFromState.editMode
      }
      return comment
    }
    item.topicMessage = _toComment(feed.posts[0])
    if (prevFeed && prevFeed.isSavingTopic && !feed.isSavingTopic && !feed.error) {
      item.editTopicMode = false
    } else {
      const feedFromState = _.find(this.state.feeds, t => feed.id === t.id)
      item.newTitle = feedFromState ? feedFromState.newTitle : null
      item.topicMessage.newContent = feedFromState ? feedFromState.topicMessage.newContent : null
      item.editTopicMode = feedFromState && feedFromState.editTopicMode
    }

    const validPost = (post) => {
      return post.type === 'post' && (post.body && post.body.trim().length || !isSystemUser(post.userId))
    }
    if (showAll) {
      // if we are showing all comments, just iterate through the entire array
      _.forEach(feed.posts, p => {
        validPost(p) ? item.comments.push(_toComment(p)) : item.totalComments--
      })
    } else {
      // otherwise iterate from right and add to the beginning of the array
      _.forEachRight(feed.posts, (p) => {
        validPost(p) ? item.comments.unshift(_toComment(p)) : item.totalComments--
        if (!feed.showAll && item.comments.length === THREAD_MESSAGES_PAGE_SIZE)
          return false
      })
    }
    item.newComment = ''
    if (!resetNewComment) {
      const feedFromState = _.find(this.state.feeds, f => feed.id === f.id)
      item.newComment = feedFromState ? feedFromState.newComment : ''
    }
    item.hasMoreComments = item.comments.length !== item.totalComments
    // adds permalink for the feed
    // item.permalink = `/projects/${project.id}/status/${item.id}`
    item.permalink = `/projects/${project.id}#feed-${item.id}`
    return item
  }

  loadAllFeeds() {
    const { canAccessPrivatePosts, loadDashboardFeeds, loadProjectMessages, project } = this.props

    loadDashboardFeeds(project.id)
    canAccessPrivatePosts && loadProjectMessages(project.id)
  }

  toggleDrawer(open) {
    const { project } = this.props
    this.setState({ open })
    if (!open) {
      this.props.history.push(`/projects/${project.id}/messages`)
    }
  }

  onNotificationRead(notification) {
    if (notification.bundledIds) {
      this.props.toggleBundledNotificationRead(notification.id, notification.bundledIds)
    } else {
      this.props.toggleNotificationRead(notification.id)
    }
  }

  onNewCommentChange(feedId, content) {
    this.setState({
      feeds: this.state.feeds.map((item) => {
        if (item.id === feedId) {
          return {...item, newComment: content}
        }
        return item
      })
    })
  }

  onShowAllComments(feedId) {
    const { feeds } = this.props
    const feed = _.find(feeds, { id: feedId })
    const stateFeedIdx = _.findIndex(this.state.feeds, (f) => f.id === feedId)
    // in case we have already have all comments for that feed from the server,
    // just change the state to show all comments for that FeedId.
    // Otherwise load more comments from the server
    if (feed.posts.length < feed.postIds.length) {
      // load more from server
      const updatedFeed = update(this.state.feeds[stateFeedIdx], {
        isLoadingComments: { $set : true }
      })
      const retrievedPostIds = _.map(feed.posts, 'id')
      const commentIdsToRetrieve = _.filter(feed.postIds, _id => retrievedPostIds.indexOf(_id) === -1 )
      this.setState(update(this.state, {
        showAll: { $push: [feedId] },
        feeds: { $splice: [[stateFeedIdx, 1, updatedFeed ]] },
        feed: { $set: this.state.feed.id === feed.id ? updatedFeed : this.state.feed }
      }))
      this.props.loadFeedComments(feedId, feed.tag, commentIdsToRetrieve)
    } else {
      const mappedFeed = this.mapFeed(feed, true)
      this.setState(update(this.state, {
        showAll: { $push: [feedId] },
        feeds: { $splice: [[stateFeedIdx, 1, mappedFeed ]] },
        feed: { $set: this.state.feed.id === feed.id ? mappedFeed : this.state.feed }
      }))
    }
  }

  onAddNewComment(feedId, content, attachmentIds) {
    const { currentUser, feeds } = this.props
    const feed = _.find(feeds, { id: feedId })
    const newComment = {
      date: new Date(),
      userId: parseInt(currentUser.id),
      content,
    }
    if (attachmentIds) {
      Object.assign(newComment, { attachmentIds })
    }
    this.props.addFeedComment(feedId, feed.tag, newComment)
  }

  onSaveMessageChange(feedId, messageId, content, editMode) {
    this.setState({
      feeds: this.state.feeds.map((item) => {
        if (item.id === feedId) {
          const messageIndex = _.findIndex(item.comments, message => message.id === messageId)
          const message = item.comments[messageIndex]
          message.newContent = content
          message.editMode = editMode
          item.comments[messageIndex] = {...message}
          item.comments = _.map(item.comments, message => message)
          return {...item}
        }
        return item
      })
    })
  }

  onSaveMessage(feedId, message, content, attachmentIds) {
    const newMessage = {...message}
    const { feeds } = this.state
    const feed = _.find(feeds, { id: feedId })
    Object.assign(newMessage, {content, attachmentIds})
    this.props.saveFeedComment(feedId, feed.tag, newMessage)
  }

  onDeleteMessage(feedId, postId) {
    const { feeds } = this.state
    const feed = _.find(feeds, { id: feedId })
    this.props.deleteFeedComment(feedId, feed.tag, postId)
  }

  onEditMessage(feedId, postId) {
    const { feeds } = this.state
    const feed = _.find(feeds, { id: feedId })
    const comment = _.find(feed.comments, message => message.id === postId)
    if (!comment.rawContent) {
      this.props.getFeedComment(feedId, feed.tag, postId)
    }
    this.onSaveMessageChange(feedId, postId, null, true)
  }

  onEditTopic(feedId) {
    const { feeds } = this.state
    const feed = _.find(feeds, { id: feedId })
    const comment = feed.topicMessage
    if (!comment.rawContent) {
      this.props.getFeedComment(feedId, feed.tag, comment.id)
    }
    this.onTopicChange(feedId, comment.id, null, null, true)
  }

  onTopicChange(feedId, messageId, title, content, editTopicMode) {
    this.setState({
      feeds: this.state.feeds.map((item) => {
        if (item.id === feedId) {
          item.newTitle = title
          item.editTopicMode = editTopicMode
          item.topicMessage = {...item.topicMessage, newContent: content}
          return {...item}
        }
        return item
      })
    })
  }

  onSaveTopic(feedId, postId, title, content) {
    const { feeds } = this.state
    const feed = _.find(feeds, { id: feedId })
    const newTopic = { postId, title, content }
    this.props.saveProjectTopic(feedId, feed.tag, newTopic)
  }

  onDeleteTopic(feedId) {
    const { feeds } = this.state
    const feed = _.find(feeds, { id: feedId })
    this.props.deleteProjectTopic(feedId, feed.tag)
  }

  render() {
    const {
      currentUser,
      currentMemberRole,
      allMembers,
      projectMembers,
      project,
      isSuperUser,
      notifications,
      isFeedsLoading
    } = this.props
    
    const { feed } = this.state

    // system notifications
    const notReadNotifications = filterReadNotifications(notifications)
    const unreadProjectUpdate = filterProjectNotifications(filterNotificationsByProjectId(notReadNotifications, project.id))
    const sortedUnreadProjectUpdates = _.orderBy(unreadProjectUpdate, ['date'], ['desc'])

    const leftArea = (
      <div>Sidebar placeholder</div>
    )

    return (
      <TwoColsLayout>
        <NotificationsReader
          id="dashboard"
          criteria={[
            { eventType: EVENT_TYPE.PROJECT.ACTIVE, contents: { projectId: project.id } },
            { eventType: EVENT_TYPE.MEMBER.JOINED, contents: { projectId: project.id } },
            { eventType: EVENT_TYPE.MEMBER.LEFT, contents: { projectId: project.id } },
            { eventType: EVENT_TYPE.MEMBER.REMOVED, contents: { projectId: project.id } },
            { eventType: EVENT_TYPE.MEMBER.ASSIGNED_AS_OWNER, contents: { projectId: project.id } },
            { eventType: EVENT_TYPE.MEMBER.COPILOT_JOINED, contents: { projectId: project.id } },
            { eventType: EVENT_TYPE.MEMBER.MANAGER_JOINED, contents: { projectId: project.id } },
          ]}
        />

        <TwoColsLayout.Sidebar>
          <MediaQuery minWidth={SCREEN_BREAKPOINT_MD}>
            {(matches) => {
              if (matches) {
                return <Sticky top={110}>{leftArea}</Sticky>
              } else {
                return leftArea
              }
            }}
          </MediaQuery>
        </TwoColsLayout.Sidebar>

        <TwoColsLayout.Content>
          {unreadProjectUpdate.length > 0 &&
            <SystemFeed
              messages={sortedUnreadProjectUpdates}
              user={CODER_BOT_USER}
              onNotificationRead={this.onNotificationRead}
            />
          }
          {/* The following containerStyle and overlayStyle are needed for shrink drawer and overlay size for not covering sidebar and topbar */}
          {feed && (
            <MessagesDrawer
              open={this.state.open}
              zDepth={15}
              containerStyle={{top: '110px', height: 'calc(100% - 110px)', display: 'flex', flexDirection: 'column' }}
              overlayStyle={{top: '110px', left: '360px'}}
              onRequestChange={this.toggleDrawer}
              processing={isFeedsLoading || !feed}
              {...{
                feed,
                currentUser,
                allMembers,
                projectMembers,
                currentMemberRole,
                onNewCommentChange: this.onNewCommentChange,
                onAddNewComment: this.onAddNewComment,
                onShowAllComments: this.onShowAllComments,
                onEditMessage: this.onEditMessage,
                onSaveMessageChange: this.onSaveMessageChange,
                onSaveMessage: this.onSaveMessage,
                onDeleteMessage: this.onDeleteMessage,
                onEditTopic: this.onEditTopic,
                onTopicChange: this.onTopicChange,
                onSaveTopic: this.onSaveTopic,
                onDeleteTopic: this.onDeleteTopic,
                enterFullscreen: () => null
              }}
            />
          )}

          <MessagesFeedContainer
            currentMemberRole={currentMemberRole}
            project={project}
            isSuperUser={isSuperUser}
          />
        </TwoColsLayout.Content>
      </TwoColsLayout>
    )
  }
}

const mapStateToProps = ({ notifications, projectState, projectTopics, members, loadUser }) => {
  const allMembers = _.extend({
    ...members.members,
    [CODER_BOT_USERID]: CODER_BOT_USER
  })

  const project = projectState.project
  const projectMembersMap = _.keyBy(project.members, 'userId')
  let projectMembers = Object.values(allMembers) 
    .filter(m => projectMembersMap.hasOwnProperty(m.userId))
    .map(m => ({
      ...m,
      role:projectMembersMap[m.userId].role
    }))
  projectMembers = _.keyBy(projectMembers, 'userId')

  // all feeds includes primary as well as private topics if user has access to private topics
  let allFeed = projectTopics.feeds[PROJECT_FEED_TYPE_PRIMARY].topics
  const canAccessPrivatePosts = checkPermission(PERMISSIONS.ACCESS_PRIVATE_POST)
  if (canAccessPrivatePosts) {
    allFeed = [...allFeed, ...projectTopics.feeds[PROJECT_FEED_TYPE_MESSAGES].topics]
  }
  allFeed.sort(sortFeedByNewestMsg)

  return {
    notifications: preRenderNotifications(notifications.notifications),
    feeds: allFeed,
    isFeedsLoading: projectTopics.isLoading,
    allMembers,
    projectMembers,
    canAccessPrivatePosts,
    currentUser: loadUser.user
  }
}

const mapDispatchToProps = {
  toggleNotificationRead,
  toggleBundledNotificationRead,
  loadDashboardFeeds,
  loadProjectMessages,
  saveProjectTopic,
  deleteProjectTopic,
  loadFeedComments,
  addFeedComment,
  saveFeedComment,
  deleteFeedComment,
  getFeedComment
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MessagesContainer))
