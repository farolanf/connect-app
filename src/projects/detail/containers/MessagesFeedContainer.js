/**
 * Container for Dashboard Posts Section
 */
import React from 'react'
import PropTypes from 'prop-types'
import { Prompt } from 'react-router-dom'
import moment from 'moment'
import _ from 'lodash'
import {
  PROJECT_FEED_TYPE_PRIMARY,
  PROJECT_FEED_TYPE_MESSAGES,
  SCREEN_BREAKPOINT_MD,
  EVENT_TYPE,
  CODER_BOT_USERID,
  CODER_BOT_USER
} from '../../../config/constants'
import { connect } from 'react-redux'
import NewPost from '../../../components/Feed/NewPost'

import { loadDashboardFeeds, loadProjectMessages, createProjectTopic } from '../../actions/projectTopics'
import { toggleNotificationRead } from '../../../routes/notifications/actions'
import spinnerWhileLoading from '../../../components/LoadingSpinner'
import PostsRefreshPrompt from '../components/PostsRefreshPrompt'

import MediaQuery from 'react-responsive'
import ChatButton from '../../../components/ChatButton/ChatButton'
import NewPostMobile from '../../../components/Feed/NewPostMobile'
import Section from '../components/Section'
import CardListHeader from '../components/CardListHeader/CardListHeader'
import TopicCard from '../components/TopicCard/TopicCard'

import { checkPermission } from '../../../helpers/permissions'
import PERMISSIONS from '../../../config/permissions'

import './FeedContainer.scss'

const isPrivateFeed = feed => feed.tag === PROJECT_FEED_TYPE_MESSAGES

const getLatestMsgDate = feed => {
  if (feed.posts && feed.posts.length) {
    return feed.posts[0].date
  }
}

const getFileCount = feed => {
  return (feed.posts || []).reduce((count, post) => count + post.attachments.length, 0)
}

const getLinkCount = feed => {
  const linkRegex = /\[.+?\]\(.+?\)/g
  return (feed.posts || []).reduce((count, post) => {
    const match = post.body.match(linkRegex)
    return match ? count + match.length : count
  }, 0)
}

const getPrivateCount = feeds => feeds.filter(isPrivateFeed).length

const sortFeedByNewestMsg = (a, b) =>
  moment(b.posts.length && b.posts[0].date).valueOf()
  - moment(a.posts.length && a.posts[0].date).valueOf()

class FeedView extends React.Component {

  constructor(props) {
    super(props)
    this.onNewPost = this.onNewPost.bind(this)
    this.onLeave = this.onLeave.bind(this)
    this.isChanged = this.isChanged.bind(this)
    this.onNewPostChange = this.onNewPostChange.bind(this)
    this.onRefreshFeeds = this.onRefreshFeeds.bind(this)
    this.toggleNewPostMobile = this.toggleNewPostMobile.bind(this)
    this.hasNewMsg = this.hasNewMsg.bind(this)
    this.state = {
      newMessagesFilter: 'all',
      earlierMessagesFilter: 'all',
      newPost: {},
      isNewPostMobileOpen: false
    }
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.onLeave)
  }

  componentWillMount() {
    this.init(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.init(nextProps, this.props)
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onLeave)
  }

  // Notify user if they navigate away while the form is modified.
  onLeave(e = {}) {
    if (this.isChanged()) {
      return e.returnValue = 'You haven\'t posted your message. If you leave this page, your message will not be saved. Are you sure you want to leave?'
    }
  }

  toggleNewPostMobile() {
    this.setState({ isNewPostMobileOpen: !this.state.isNewPostMobileOpen })
  }

  isChanged() {
    const { newPost } = this.state
    const hasThread = (newPost.title && !!newPost.title.trim().length) || ( newPost.content && !!newPost.content.trim().length)
    return hasThread
  }

  init(props, prevProps) {
    let resetNewPost = false
    if (prevProps) {
      resetNewPost = prevProps.isCreatingFeed && !props.isCreatingFeed && !props.error
    }
    this.setState({
      newPost: resetNewPost ? {} : this.state.newPost
    })
  }

  getPhotoUrl(feed) {
    const { allMembers } = this.props
    if (allMembers) {
      const user = allMembers[feed.userId]
      return user && user.photoURL
    }
  }

  getLastMsgAuthorName(feed) {
    const { allMembers } = this.props
    if (allMembers) {
      const msg = feed.posts.length && feed.posts[0]
      if (msg) {
        const user = allMembers[msg.userId]
        if (user) {
          return `${user.firstName} ${user.lastName}`
        }
      }
    }
  }

  isNewMsg(notification, feed) {
    const { project } = this.props
    return Number(notification.contents.projectId) === project.id
      && notification.contents.topicId === feed.id
      && !notification.isRead
      && [
        EVENT_TYPE.POST.CREATED,
        EVENT_TYPE.POST.UPDATED,
        EVENT_TYPE.POST.MENTION,
        EVENT_TYPE.TOPIC.CREATED
      ].includes(notification.eventType)    
  }

  hasNewMsg(feed) {
    const { notifications: { notifications } } = this.props
    return !!notifications.find(noti => this.isNewMsg(noti, feed))
  }

  getNewMsgCount(feed) {
    const { notifications: { notifications } } = this.props
    return notifications.filter(noti => this.isNewMsg(noti, feed)).length
  }

  getEarliestNewMsgDate(feed) {
    const { notifications: { notifications } } = this.props
    for (let i = notifications.length - 1; i >= 0; i--) {
      if (this.isNewMsg(notifications[i], feed)) {
        return notifications[i].date
      }
    }
  }

  onNewPostChange(title, content) {
    this.setState({
      newPost: {title, content}
    })
  }

  onNewPost({title, content, isPrivate = false, attachmentIds}) {
    const { project } = this.props
    const newFeed = {
      title,
      body: content,
      tag: isPrivate ? PROJECT_FEED_TYPE_MESSAGES : PROJECT_FEED_TYPE_PRIMARY
    }
    if (attachmentIds) {
      Object.assign(newFeed, { attachmentIds })
    }
    this.props.createProjectTopic(project.id, newFeed)
  }

  onRefreshFeeds() {
    const { loadDashboardFeeds, loadProjectMessages, project, canAccessPrivatePosts } = this.props
    loadDashboardFeeds(project.id)
    canAccessPrivatePosts && loadProjectMessages(project.id)
  }

  render () {
    const { feeds, currentUser, isCreatingFeed, error, allMembers,
      toggleNotificationRead, notifications, project, projectMembers, canAccessPrivatePosts } = this.props
    const { isNewPostMobileOpen, newMessagesFilter, earlierMessagesFilter } = this.state
    const isChanged = this.isChanged()
    const onLeaveMessage = this.onLeave() || ''
    const newFeeds = feeds.filter(feed => this.hasNewMsg(feed)
      && (
        newMessagesFilter === 'all'
        || (newMessagesFilter === 'private' && feed.tag === PROJECT_FEED_TYPE_MESSAGES)
      ))
    const oldFeeds = feeds.filter(feed => !this.hasNewMsg(feed)
      && (
        earlierMessagesFilter === 'all'
        || (earlierMessagesFilter === 'private' && feed.tag === PROJECT_FEED_TYPE_MESSAGES)
      ))

    return (
      <div>
        <PostsRefreshPrompt
          preventShowing={isChanged}
          toggleNotificationRead={toggleNotificationRead}
          refreshFeeds={this.onRefreshFeeds}
          notifications={notifications}
          projectId={project.id}
        />

        <Prompt
          when={!!onLeaveMessage}
          message={onLeaveMessage}
        />

        <Section>
          <div>
            <MediaQuery minWidth={SCREEN_BREAKPOINT_MD}>
              <NewPost
                currentUser={currentUser}
                allMembers={allMembers}
                projectMembers={projectMembers}
                onPost={this.onNewPost}
                isCreating={isCreatingFeed}
                hasError={error}
                heading="NEW STATUS POST"
                onNewPostChange={this.onNewPostChange}
                titlePlaceholder="Start a new discussion"
                expandedTitlePlaceholder="Add your discussion title"
                contentPlaceholder="Add your first post"
                canAccessPrivatePosts={canAccessPrivatePosts}
              />
            </MediaQuery>
            {(!!newFeeds.length || newMessagesFilter !== 'all') && (
              <CardListHeader
                title="New Messages"
                privateCount={getPrivateCount(newFeeds)}
                filter={newMessagesFilter}
                onClickAll={() => this.setState({ newMessagesFilter: 'all' })}
                onClickAdminOnly={() => this.setState({ newMessagesFilter: 'private' })}
              />
            )}
            {newFeeds.map((feed) => (
              <TopicCard
                key={feed.id}
                variant="new-message"
                title={feed.title}
                date={this.getEarliestNewMsgDate(feed)}
                newMsgCount={this.getNewMsgCount(feed)}
                fileCount={getFileCount(feed)}
                linkCount={getLinkCount(feed)}
                isPrivate={isPrivateFeed(feed)}
              />
            ))}
            {(!!oldFeeds.length || earlierMessagesFilter !== 'all') && (
              <CardListHeader
                title="Earlier Messages"
                privateCount={getPrivateCount(oldFeeds)}
                filter={earlierMessagesFilter}
                onClickAll={() => this.setState({ earlierMessagesFilter: 'all' })}
                onClickAdminOnly={() => this.setState({ earlierMessagesFilter: 'private' })}
              />
            )}
            {oldFeeds.map(feed => (
              <TopicCard
                key={feed.id}
                title={feed.title}
                avatarUrl={this.getPhotoUrl(feed)}
                date={getLatestMsgDate(feed)}
                lastMsgAuthorName={this.getLastMsgAuthorName(feed)}
                fileCount={getFileCount(feed)}
                linkCount={getLinkCount(feed)}
                isPrivate={isPrivateFeed(feed)}
              />
            ))}
          </div>
        </Section>
        { !isNewPostMobileOpen &&
          <MediaQuery maxWidth={SCREEN_BREAKPOINT_MD - 1}>
            <div styleName="chat-button-space">
              <ChatButton onClick={this.toggleNewPostMobile} />
            </div>
          </MediaQuery>
        }
        { isNewPostMobileOpen &&
          <NewPostMobile
            statusTitle="NEW STATUS"
            commentTitle="WRITE POST"
            statusPlaceholder="Start a new discussion"
            commentPlaceholder="Add your first post"
            submitText="Post"
            nextStepText="Add post"
            onClose={this.toggleNewPostMobile}
            allMembers={allMembers}
            currentUser={currentUser}
            onPost={this.onNewPost}
            isCreating={isCreatingFeed}
            hasError={error}
            onNewPostChange={this.onNewPostChange}
            canAccessPrivatePosts={canAccessPrivatePosts}
          />
        }
      </div>
    )
  }
}
const enhance = spinnerWhileLoading(props => !props.isLoading)
const EnhancedFeedView = enhance(FeedView)

class FeedContainer extends React.Component {
  constructor(props) {
    super(props)
  }

  componentWillMount() {
    // As we implemented links to the topics on the Dashboard and Plan tabs sidebars
    // we want to navigate between topics on the different tabs
    // to make navigation smooth, we don't reload feeds on the dashboard tab
    // every time we switch to the dashboard tab
    // TODO this is an experimental way, we have to think if this is good
    //      or we have reload feeds some way still keeping navigation smooth
    // this.props.loadDashboardFeeds(this.props.project.id)
  }

  render() {
    return <EnhancedFeedView {...this.props} />
  }
}

FeedContainer.PropTypes = {
  currentMemberRole: PropTypes.string,
  project: PropTypes.object.isRequired,
  canAccessPrivatePosts: PropTypes.bool.isRequired,
}

const mapStateToProps = ({ projectTopics, members, loadUser, notifications, projectState }) => {
  const allMembers = _.extend({
    ...members.members,
    [CODER_BOT_USERID]: CODER_BOT_USER
  })

  const project = projectState.project
  const projectMembersMap = _.keyBy(project.members, 'userId')
  const projectMembers = Object.values(allMembers) 
    .filter(m => projectMembersMap.hasOwnProperty(m.userId))
    .map(m => ({
      ...m,
      role:projectMembersMap[m.userId].role
    }))
  // all feeds includes primary as well as private topics if user has access to private topics
  let allFeed = projectTopics.feeds[PROJECT_FEED_TYPE_PRIMARY].topics
  const canAccessPrivatePosts = checkPermission(PERMISSIONS.ACCESS_PRIVATE_POST)
  if (canAccessPrivatePosts) {
    allFeed = [...allFeed, ...projectTopics.feeds[PROJECT_FEED_TYPE_MESSAGES].topics]
  }
  const allFeedCount = projectTopics.feeds[PROJECT_FEED_TYPE_PRIMARY].totalCount + (canAccessPrivatePosts ? projectTopics.feeds[PROJECT_FEED_TYPE_MESSAGES].totalCount : 0)

  allFeed.sort(sortFeedByNewestMsg)
  
  console.log('members', allMembers)
  console.log('feeds', allFeed)

  return {
    currentUser    : loadUser.user,
    feeds          : allFeed,
    feedTotalCount : allFeedCount,
    isLoading      : projectTopics.isLoading,
    isCreatingFeed : projectTopics.isCreatingFeed,
    error          : projectTopics.error,
    allMembers,
    projectMembers : _.keyBy(projectMembers, 'userId'),
    notifications,
    canAccessPrivatePosts,
  }
}
const mapDispatchToProps = {
  loadDashboardFeeds,
  loadProjectMessages,
  createProjectTopic,
  toggleNotificationRead,
}

export default connect(mapStateToProps, mapDispatchToProps)(FeedContainer)
