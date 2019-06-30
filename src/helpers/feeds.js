import moment from 'moment'

import { isSystemUser } from './tcHelpers'

import {
  THREAD_MESSAGES_PAGE_SIZE,
  CONNECT_USER,
  CODER_BOT_USER as SYSTEM_USER
} from '../config/constants'

export const sortFeedByNewestMsg = (a, b) =>
  moment(b.posts.length && b.posts[0].date).valueOf()
  - moment(a.posts.length && a.posts[0].date).valueOf()

export const mapFeed = (feed, showAll = false, resetNewComment = false, stateFeeds, props, prevProps) => {
  const { allMembers, project, currentMemberRole } = props
  const item = _.pick(feed, ['id', 'date', 'read', 'tag', 'title', 'totalPosts', 'userId', 'reference', 'referenceId', 'postIds', 'isSavingTopic', 'isDeletingTopic', 'isAddingComment', 'isLoadingComments', 'error'])
  // Github issue##623, allow comments on all posts (including system posts)
  item.allowComments = true
  if (isSystemUser(item.userId)) {
    item.user = SYSTEM_USER
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
      author: isSystemUser(p.userId) ? SYSTEM_USER : commentAuthor,
      attachments: p.attachments || []
    }
    const prevComment = prevFeed ? _.find(prevFeed.posts, t => p.id === t.id) : null
    if (prevComment && prevComment.isSavingComment && !comment.isSavingComment && !comment.error) {
      comment.editMode = false
    } else {
      const feedFromState = _.find(stateFeeds, t => feed.id === t.id)
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
    const feedFromState = _.find(stateFeeds, t => feed.id === t.id)
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
    const feedFromState = _.find(stateFeeds, f => feed.id === f.id)
    item.newComment = feedFromState ? feedFromState.newComment : ''
  }
  item.hasMoreComments = item.comments.length !== item.totalComments
  // adds permalink for the feed
  // item.permalink = `/projects/${project.id}/status/${item.id}`
  item.permalink = `/projects/${project.id}#feed-${item.id}`
  return item
}
