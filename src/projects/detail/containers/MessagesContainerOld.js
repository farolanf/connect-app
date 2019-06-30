import _ from 'lodash'
import React from 'react'
import { Prompt, withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import update from 'react-addons-update'
import CardListHeader from '../components/CardListHeader/CardListHeader'
import TopicCard from '../components/TopicCard/TopicCard'
import MessagingEmptyState from '../../../components/MessageList/MessagingEmptyState'
import NewPost from '../../../components/Feed/NewPost'
import { loadProjectMessages, createProjectTopic, saveProjectTopic, deleteProjectTopic, loadFeedComments, addFeedComment, saveFeedComment, deleteFeedComment, getFeedComment } from '../../actions/projectTopics'
import spinnerWhileLoading from '../../../components/LoadingSpinner'
import TwoColsLayout from '../../../components/TwoColsLayout'

import { checkPermission } from '../../../helpers/permissions'
import PERMISSIONS from '../../../config/permissions'

import {
  THREAD_MESSAGES_PAGE_SIZE,
  PROJECT_FEED_TYPE_MESSAGES,
  PROJECT_FEED_TYPE_PRIMARY,
  DISCOURSE_BOT_USERID,
  CODER_BOT_USERID,
  CODER_BOT_USER_FNAME,
  CODER_BOT_USER_LNAME,
  TC_SYSTEM_USERID
} from '../../../config/constants'

import './MessagesContainer.scss'

const SYSTEM_USER = {
  firstName: CODER_BOT_USER_FNAME,
  lastName: CODER_BOT_USER_LNAME,
  photoURL: require('file-loader?../../../assets/images/avatar-coder.svg')
}
const isSystemUser = (userId) => [DISCOURSE_BOT_USERID, CODER_BOT_USERID, TC_SYSTEM_USERID].indexOf(userId) > -1

class MessagesView extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      threads : [],
      activeThreadId : null,
      showEmptyState : true,
      showAll: [],
      newPost: {}
    }
    this.onThreadSelect = this.onThreadSelect.bind(this)
    this.onShowAllComments = this.onShowAllComments.bind(this)
    this.onAddNewMessage = this.onAddNewMessage.bind(this)
    this.onNewMessageChange = this.onNewMessageChange.bind(this)
    this.onNewPost = this.onNewPost.bind(this)
    this.onLeave = this.onLeave.bind(this)
    this.isChanged = this.isChanged.bind(this)
    this.onNewPostChange = this.onNewPostChange.bind(this)
    this.changeThread = this.changeThread.bind(this)
    this.showNewThreadForm = this.showNewThreadForm.bind(this)
    this.onEditMessage = this.onEditMessage.bind(this)
    this.onSaveMessageChange = this.onSaveMessageChange.bind(this)
    this.onEditTopic = this.onEditTopic.bind(this)
    this.onTopicChange = this.onTopicChange.bind(this)
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

  isChanged() {
    const { newPost } = this.state
    const hasMessage = !_.isUndefined(_.find(this.state.threads, (thread) => (thread.isSavingTopic || thread.isDeletingTopic || thread.isAddingComment)
      || (thread.newMessage && thread.newMessage.length)
      || (thread.newTitle && thread.newTitle.length && thread.newTitle !== thread.title)
      || (thread.topicMessage && thread.topicMessage.newContent && thread.topicMessage.newContent.length && thread.topicMessage.rawContent && thread.topicMessage.newContent !== thread.topicMessage.rawContent)
      || !_.isUndefined(_.find(thread.messages, (message) => message.isSavingComment || message.isDeletingComment || (message.newContent && message.newContent.length && message.rawContent && message.newContent !== message.rawContent)))
    ))
    const hasThread = (newPost.title && !!newPost.title.trim().length) || ( newPost.content && !!newPost.content.trim().length)
    return hasThread || hasMessage
  }

  mapFeed(feed, isActive, showAll = false, resetNewMessage = false, prevProps) {
    const { allMembers } = this.props
    const item = _.pick(feed, ['id', 'date', 'read', 'tag', 'title', 'totalPosts', 'userId', 'reference', 'referenceId', 'postIds', 'isSavingTopic', 'isDeletingTopic', 'isAddingComment', 'isLoadingComments', 'error'])
    item.isActive = isActive
    // Github issue##623, allow comments on all posts (including system posts)
    item.allowComments = true
    if (isSystemUser(item.userId)) {
      item.user = SYSTEM_USER
    } else {
      item.user = allMembers[item.userId]
    }
    item.unread = !feed.read
    // Github issue#673, Don't skip over the first post like we do in dashboard feeds
    // because here we show the first post as comment as well
    item.totalComments = feed.totalPosts
    item.messages = []
    let prevThread = null
    if (prevProps) {
      prevThread = _.find(prevProps.threads, t => feed.id === t.id)
    }
    const _toComment = (p) => {
      const date = p.updatedDate?p.updatedDate:p.date
      const edited = date !== p.date
      const comment= {
        id: p.id,
        content: p.body,
        rawContent: p.rawContent,
        isGettingComment: p.isGettingComment,
        isSavingComment: p.isSavingComment,
        isDeletingComment: p.isDeletingComment,
        error: p.error,
        unread: !p.read,
        date: p.date,
        edited,
        author: isSystemUser(p.userId) ? SYSTEM_USER : allMembers[p.userId]
      }
      const prevComment = prevThread ? _.find(prevThread.posts, t => p.id === t.id) : null
      if (prevComment && prevComment.isSavingComment && !comment.isSavingComment && !comment.error) {
        comment.editMode = false
      } else {
        const threadFromState = _.find(this.state.threads, t => feed.id === t.id)
        const commentFromState = threadFromState ? _.find(threadFromState.messages, t => comment.id === t.id) : null
        comment.newContent = commentFromState ? commentFromState.newContent : null
        comment.editMode = commentFromState && commentFromState.editMode
      }
      return comment
    }
    item.topicMessage = _toComment(feed.posts[0])
    if (prevThread && prevThread.isSavingTopic && !feed.isSavingTopic && !feed.error) {
      item.editTopicMode = false
    } else {
      const threadFromState = _.find(this.state.threads, t => feed.id === t.id)
      item.newTitle = threadFromState ? threadFromState.newTitle : null
      item.topicMessage.newContent = threadFromState ? threadFromState.topicMessage.newContent : null
      item.editTopicMode = threadFromState && threadFromState.editTopicMode
    }
    const validPost = (post) => {
      return post.type === 'post' && (post.body && post.body.trim().length || !isSystemUser(post.userId))
    }
    if (showAll) {
      // if we are showing all comments, just iterate through the entire array
      _.forEach(feed.posts, p => {
        validPost(p) ? item.messages.push(_toComment(p)) : item.totalComments--
      })
    } else {
      // otherwise iterate from right and add to the beginning of the array
      _.forEachRight(feed.posts, (p) => {
        validPost(p) ? item.messages.unshift(_toComment(p)) : item.totalComments--
        if (!feed.showAll && item.messages.length === THREAD_MESSAGES_PAGE_SIZE)
          return false
      })
    }
    item.newMessage = ''
    if (!resetNewMessage) {
      const threadFromState = _.find(this.state.threads, t => feed.id === t.id)
      item.newMessage = threadFromState ? threadFromState.newMessage : ''
    }
    item.hasMoreMessages = item.messages.length < item.totalComments
    return item
  }

  init(props, prevProps) {
    const { activeThreadId } = this.state
    const propsThreadId = _.get(props, 'params.discussionId', null)
    const threadId = activeThreadId ? activeThreadId : parseInt(propsThreadId)
    let activeThreadIndex = threadId
      ? _.findIndex(props.threads, (thread) => thread.id === threadId )
      : 0
    if (activeThreadIndex < 0) {
      activeThreadIndex = 0
    }
    props.threads.length && this.setState({activeThreadId: props.threads[activeThreadIndex].id})
    let resetNewPost = false
    if (prevProps) {
      resetNewPost = prevProps.isCreatingFeed && !props.isCreatingFeed && !props.error
    }
    this.setState({
      newPost: resetNewPost ? {} : this.state.newPost,
      scrollPosition: activeThreadIndex * 71,
      threads: props.threads.map((thread, idx) => {
        // finds the same thread from previous props, if exists
        let prevThread
        if (prevProps && prevProps.threads) {
          prevThread = _.find(prevProps.threads, t => thread.id === t.id)
        }
        // reset new message if we were adding message and there is no error in doing so
        const resetNewMessage = prevThread && prevThread.isAddingComment && !thread.isAddingComment && !thread.error
        return this.mapFeed(thread,
          idx === activeThreadIndex,
          this.state.showAll.indexOf(thread.id) > -1,
          resetNewMessage, prevProps)
      }).filter(item => item)
    })
  }

  getPhotoUrl(thread) {
    const { allMembers } = this.props
    if (allMembers) {
      const user = allMembers[thread.userId]
      return user.photoURL
    }
  }

  onShowAllComments(theadId) {
    const { threads } = this.props
    const thread = _.find(threads, thread => thread.id === theadId)
    const stateFeedIdx = _.findIndex(this.state.threads, (f) => f.id === theadId)
    // in case we have already have all comments for that thread from the server,
    // just change the state to show all comments for that FeedId.
    // Otherwise load more comments from the server
    if (thread.posts.length < thread.postIds.length) {
      // load more from server
      const updatedFeed = update(this.state.threads[stateFeedIdx], {
        isLoadingComments: { $set : true }
      })
      const retrievedPostIds = _.map(thread.posts, 'id')
      const commentIdsToRetrieve = _.filter(thread.postIds, _id => retrievedPostIds.indexOf(_id) === -1 )
      this.setState(update(this.state, {
        showAll: { $push: [theadId] },
        threads: { $splice: [[stateFeedIdx, 1, updatedFeed ]] }
      }))
      this.props.loadFeedComments(theadId, PROJECT_FEED_TYPE_MESSAGES, commentIdsToRetrieve)
    } else {
      this.setState(update(this.state, {
        showAll: { $push: [theadId] },
        threads: { $splice: [[stateFeedIdx, 1, this.mapFeed(thread, true, true) ]] }
      }))
    }
  }

  onThreadSelect(thread) {
    if (!this.state.isCreateNewMessage && thread.id === this.state.activeThreadId) {
      return
    }
    const unsavedContentMsg = this.onLeave({})
    if (unsavedContentMsg) {
      const changeConfirmed = confirm(unsavedContentMsg)
      if (changeConfirmed) {
        this.changeThread(thread)
      }
    } else {
      this.changeThread(thread)
    }
  }

  changeThread(thread) {
    this.setState({
      isCreateNewMessage: false,
      newPost: {},
      activeThreadId: thread.id,
      threads: this.state.threads.map((item) => {
        if (item.isActive) {
          if (item.id === thread.id) {
            return item
          }
          return {...item, isActive: false, newMessage: '', newTitle: null, editTopicMode: false,
            topicMessage: {...item.topicMessage, newContent: null},
            messages: item.messages.map((msg) => ({...msg, newContent: null, editMode: false, unread: false}))
          }
        }
        if (item.id === thread.id) {
          return {...item, isActive: true, unreadCount: 0}
        }
        return item
      })
    }, () => {
      this.props.history.push(`/projects/${this.props.project.id}/messages/${thread.id}`)
    })
  }

  onNewPostChange(title, content) {
    this.setState({
      newPost: {title, content}
    })
  }

  showNewThreadForm() {
    this.setState({
      isCreateNewMessage: true,
      threads: this.state.threads.map((item) => {
        if (item.isActive) {
          return {...item, newMessage: '', newTitle: null, editTopicMode: false,
            topicMessage: {...item.topicMessage, newContent: null},
            messages: item.messages.map((msg) => ({...msg, newContent: null, editMode: false}))
          }
        }
        return item
      })
    })
  }

  onNewMessageChange(content) {
    this.setState({
      threads: this.state.threads.map((item) => {
        if (item.isActive) {
          return {...item, newMessage: content}
        }
        return item
      })
    })
  }

  onAddNewMessage(threadId, content, attachmentIds) {
    const { currentUser } = this.props
    const newMessage = {
      date: new Date(),
      userId: parseInt(currentUser.id),
      content
    }
    if (attachmentIds) {
      Object.assign(newMessage, { attachmentIds })
    }
    this.props.addFeedComment(threadId, PROJECT_FEED_TYPE_MESSAGES, newMessage)
  }

  onSaveMessageChange(threadId, messageId, content, editMode) {
    this.setState({
      threads: this.state.threads.map((item) => {
        if (item.id === threadId) {
          const messageIndex = _.findIndex(item.messages, message => message.id === messageId)
          const message = item.messages[messageIndex]
          message.newContent = content
          message.editMode = editMode
          item.messages[messageIndex] = {...message}
          item.messages = _.map(item.messages, message => message)
          return {...item}
        }
        return item
      })
    })
  }

  onSaveMessage(threadId, message, content, attachmentIds) {
    const newMessage = {...message}
    Object.assign(newMessage, {content, attachmentIds})
    this.props.saveFeedComment(threadId, PROJECT_FEED_TYPE_MESSAGES, newMessage)
  }

  onDeleteMessage(threadId, postId) {
    this.props.deleteFeedComment(threadId, PROJECT_FEED_TYPE_MESSAGES, postId)
  }

  onEditMessage(threadId, postId) {
    const thread = _.find(this.state.threads, t => threadId === t.id)
    const comment = _.find(thread.messages, message => message.id === postId)
    if (!comment.rawContent) {
      this.props.getFeedComment(threadId, PROJECT_FEED_TYPE_MESSAGES, postId)
    }
    this.onSaveMessageChange(threadId, postId, null, true)
  }

  onEditTopic(threadId) {
    const thread = _.find(this.state.threads, t => threadId === t.id)
    const comment = thread.topicMessage
    if (!comment.rawContent) {
      this.props.getFeedComment(threadId, PROJECT_FEED_TYPE_MESSAGES, comment.id)
    }
    this.onTopicChange(threadId, comment.id, null, null, true)
  }

  onTopicChange(threadId, messageId, title, content, editTopicMode) {
    this.setState({
      threads: this.state.threads.map((item) => {
        if (item.id === threadId) {
          item.newTitle = title
          item.editTopicMode = editTopicMode
          item.topicMessage = {...item.topicMessage, newContent: content}
          return {...item}
        }
        return item
      })
    })
  }

  onSaveTopic(threadId, postId, title, content) {
    const newTopic = { postId, title, content }
    this.props.saveProjectTopic(threadId, PROJECT_FEED_TYPE_MESSAGES, newTopic)
  }

  onDeleteTopic(threadId) {
    this.props.deleteProjectTopic(threadId, PROJECT_FEED_TYPE_MESSAGES)
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

  render() {
    const {threads, showEmptyState} = this.state
    const { currentUser, isCreatingFeed, currentMemberRole, allMembers, projectMembers, canAccessPrivatePosts, error } = this.props
    const onLeaveMessage = this.onLeave() || ''

    console.log('members', allMembers)
    console.log('threads', threads)
    console.log('notifications', this.props.notifications)
  
    return (
      <TwoColsLayout>
        <Prompt
          when={!!onLeaveMessage}
          message={onLeaveMessage}
        />

        <TwoColsLayout.Sidebar>
        </TwoColsLayout.Sidebar>
        
        <TwoColsLayout.Content>
          <div styleName="content">
            { (false && showEmptyState && !threads.length) &&
                <MessagingEmptyState
                  currentUser={currentUser}
                  onClose={() => this.setState({showEmptyState: false})}
                />
            }
            {!!currentMemberRole && (
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
            )}
            <CardListHeader title="New Messages" />
            {threads.map(thread => (
              <TopicCard key={thread.id} variant="new-message" title={thread.title} avatarUrl={this.getPhotoUrl(thread)} newMsgCount={Math.floor(Math.random() * 100)} fileCount={Math.floor(Math.random() * 100)} linkCount={Math.floor(Math.random() * 100)} isPrivate={Math.random() > 0.5} />
            ))}
            <CardListHeader title="Earlier Messages" />
            {threads.map(thread => (
              <TopicCard key={thread.id} title={thread.title} avatarUrl={this.getPhotoUrl(thread)} fileCount={Math.floor(Math.random() * 100)} linkCount={Math.floor(Math.random() * 100)} isPrivate={Math.random() > 0.5} />
            ))}
          </div>
        </TwoColsLayout.Content>
      </TwoColsLayout>
    )
  }
}

const enhance = spinnerWhileLoading(props => !props.isLoading)
const EnhancedMessagesView = withRouter(enhance(MessagesView))

class MessagesContainer extends React.Component {
  constructor(props) {
    super(props)
  }
  componentWillMount() {
    this.props.loadProjectMessages(this.props.project.id)
  }
  render() {
    return <EnhancedMessagesView {...this.props} />
  }
}

const mapStateToProps = ({ projectTopics, notifications, members, loadUser, projectState }) => {
  const project = projectState.project
  const projectMembersMap = _.keyBy(project.members, 'userId')
  const projectMembers = Object.values(members.members) 
    .filter(m => projectMembersMap.hasOwnProperty(m.userId))
    .map(m => ({
      ...m,
      role:projectMembersMap[m.userId].role
    }))
  // all feeds includes primary as well as private topics if user has access to private topics
  const canAccessPrivatePosts = checkPermission(PERMISSIONS.ACCESS_PRIVATE_POST)
  return {
    currentUser: loadUser.user,
    threads    : projectTopics.feeds[PROJECT_FEED_TYPE_MESSAGES].topics,
    threadTotalCount : projectTopics.feeds[PROJECT_FEED_TYPE_MESSAGES].totalCount,
    isCreatingFeed : projectTopics.isCreatingFeed,
    isLoading  : projectTopics.isLoading,
    error      : projectTopics.error,
    allMembers : members.members,
    projectMembers : _.keyBy(projectMembers, 'userId'),
    canAccessPrivatePosts,
    notifications
  }
}
const mapDispatchToProps = {
  loadProjectMessages,
  createProjectTopic,
  saveProjectTopic,
  deleteProjectTopic,
  loadFeedComments,
  addFeedComment,
  saveFeedComment,
  deleteFeedComment,
  getFeedComment
}

export default connect(mapStateToProps, mapDispatchToProps)(MessagesContainer)
