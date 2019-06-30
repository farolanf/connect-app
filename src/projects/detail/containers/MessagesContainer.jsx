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

import {
  filterReadNotifications,
  filterNotificationsByProjectId,
  filterProjectNotifications,
  preRenderNotifications,
} from '../../../routes/notifications/helpers/notifications'
import { toggleNotificationRead, toggleBundledNotificationRead } from '../../../routes/notifications/actions'

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
import { sortFeedByNewestMsg, mapFeed } from '../../../helpers/feeds'

import { loadDashboardFeeds, loadProjectMessages } from '../../actions/projectTopics'

import {
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
    this.onNotificationRead = this.onNotificationRead.bind(this)
    this.toggleDrawer = this.toggleDrawer.bind(this)
  }

  onNotificationRead(notification) {
    if (notification.bundledIds) {
      this.props.toggleBundledNotificationRead(notification.id, notification.bundledIds)
    } else {
      this.props.toggleNotificationRead(notification.id)
    }
  }

  componentWillMount() {
    const { isFeedsLoading, feeds } = this.props

    // load feeds from dashboard if they are not currently loading or loaded yet
    // also it will load feeds, if we already loaded them, but it was 0 feeds before
    if (!isFeedsLoading && feeds.length < 1) {
      this.loadAllFeeds()
    }
  }

  componentWillReceiveProps(nextProps) {
    this.init(nextProps, this.props)
  }

  init(props, prevProps) {
    const { match, feeds } = props
    const { feeds: stateFeeds, showAll } = this.state

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
      return mapFeed(feed, showAll.indexOf(feed.id) > -1, resetNewComment, stateFeeds, props, prevProps)
    }).filter(item => item)

    this.setState({
      newPost: resetNewPost ? {} : this.state.newPost,
      feeds: mappedFeeds
    })

    if (match.params.topicId) {
      const topicId = Number(match.params.topicId)
      const feed = _.find(mappedFeeds, { id: topicId })
      this.setState({ feed, open: true })
    } else {
      this.setState({ open: false })
    }
  }

  loadAllFeeds() {
    const { canAccessPrivatePosts, loadDashboardFeeds, loadProjectMessages, project } = this.props

    loadDashboardFeeds(project.id)
    canAccessPrivatePosts && loadProjectMessages(project.id)
  }

  toggleDrawer() {
    this.setState((prevState) => ({
      open: !prevState.open
    }))
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

    console.log('feed', feed)
    console.log('currentUser', currentUser)

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
          <button type="button" onClick={this.toggleDrawer}>Toggle drawer</button>
          {/* The following containerStyle and overlayStyle are needed for shrink drawer and overlay size for not
              covering sidebar and topbar
           */}
          {feed && (
            <MessagesDrawer
              open={this.state.open}
              containerStyle={{top: '110px', height: 'calc(100% - 110px)', display: 'flex', flexDirection: 'column' }}
              overlayStyle={{top: '110px', left: '360px'}}
              onRequestChange={(open) => this.setState({open})}
              processing={isFeedsLoading || !feed}
              {...{
                feed,
                currentUser,
                allMembers,
                projectMembers,
                currentMemberRole
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

  console.log('feeds', allFeed)
  console.log('projectMembers', projectMembers)

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
  loadProjectMessages
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MessagesContainer))
