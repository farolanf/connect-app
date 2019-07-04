import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import * as filepicker from 'filestack-js'
import uncontrollable from 'uncontrollable'
import update from 'react-addons-update'

import FilesExplorer from './FilesExplorer'
import LinksExplorer from './LinksExplorer'
import './AssetsLibrary.scss'

import {
  FILE_PICKER_API_KEY,
  FILE_PICKER_FROM_SOURCES,
  FILE_PICKER_CNAME,
  FILE_PICKER_SUBMISSION_CONTAINER_NAME,
  PROJECT_ATTACHMENTS_FOLDER,
  PHASE_STATUS_DRAFT,
  PROJECT_STATUS_CANCELLED,
  PROJECT_FEED_TYPE_MESSAGES,
  PROJECT_ROLE_COPILOT,
  PROJECT_ROLE_MANAGER,
  DIRECT_PROJECT_URL,
  SALESFORCE_PROJECT_LEAD_LINK,
} from '../../../../config/constants'

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
      selectedTab: 'files',
    }
    this.onChangeStatus = this.onChangeStatus.bind(this)
    this.onDeleteProject = this.onDeleteProject.bind(this)
    this.onAddNewLink = this.onAddNewLink.bind(this)
    this.onDeleteLink = this.onDeleteLink.bind(this)
    this.onEditLink = this.onEditLink.bind(this)
    this.onEditAttachment = this.onEditAttachment.bind(this)
    this.onAddFile = this.onAddFile.bind(this)
    this.onUploadAttachment = this.onUploadAttachment.bind(this)
    this.removeAttachment = this.removeAttachment.bind(this)
    this.onSubmitForReview = this.onSubmitForReview.bind(this)
    this.extractLinksFromPosts = this.extractLinksFromPosts.bind(this)
    this.extractMarkdownLink = this.extractMarkdownLink.bind(this)
    this.extractHtmlLink = this.extractHtmlLink.bind(this)
    this.extractRawLink = this.extractRawLink.bind(this)
    this.getFileAttachmentName = this.getFileAttachmentName.bind(this)
    this.extractAttachmentLinksFromPosts = this.extractAttachmentLinksFromPosts.bind(this)
    this.deletePostAttachment = this.deletePostAttachment.bind(this)
    this.openFileUpload = this.openFileUpload.bind(this)
  }

  shouldComponentUpdate(nextProps, nextState) { // eslint-disable-line no-unused-vars
    return !_.isEqual(nextProps.project, this.props.project) ||
      !_.isEqual(nextProps.feeds, this.props.feeds) ||
      !_.isEqual(nextProps.phases, this.props.phases) ||
      !_.isEqual(nextProps.productsTimelines, this.props.productsTimelines) ||
      !_.isEqual(nextProps.phasesTopics, this.props.phasesTopics) ||
      !_.isEqual(nextProps.isFeedsLoading, this.props.isFeedsLoading) ||
      !_.isEqual(nextProps.isProjectProcessing, this.props.isProjectProcessing) ||
      !_.isEqual(nextProps.attachmentsAwaitingPermission, this.props.attachmentsAwaitingPermission) ||
      !_.isEqual(nextProps.attachmentPermissions, this.props.attachmentPermissions) ||
      !_.isEqual(nextProps.isSharingAttachment, this.props.isSharingAttachment) ||
      nextProps.activeChannelId !== this.props.activeChannelId ||
      nextState.selectedTab !== this.props.selectedTab
  }

  componentWillMount() {
    const { project, isFeedsLoading, feeds, phases, phasesTopics, loadPhaseFeed, location } = this.props

    // load feeds from dashboard if they are not currently loading or loaded yet
    // also it will load feeds, if we already loaded them, but it was 0 feeds before
    if (!isFeedsLoading && feeds.length < 1) {
      this.loadAllFeeds()
    }

    // load phases feeds if they are not loaded yet
    // note: old projects doesn't have phases, so we check if there are any phases at all first
    phases && phasesTopics && phases.forEach((phase) => {
      if (!phasesTopics[phase.id]) {
        loadPhaseFeed(project.id, phase.id)
      }
    })

    // handle url hash
    if (!_.isEmpty(location.hash)) {
      this.handleUrlHash(this.props)
    }
  }

  componentWillReceiveProps(props) {
    const { location } = props

    if (!_.isEmpty(location.hash) && location.hash !== this.props.location.hash) {
      this.handleUrlHash(props)
    }
  }

  // this is just to see if the comment/feed/post/phase the url hash is attempting to scroll to is loaded or not
  // if its not loaded then we load the appropriate item
  handleUrlHash(props) {
    const { project, isFeedsLoading, phases, phasesTopics, feeds, loadProjectPlan, loadPhaseFeed, location } = props
    const hashParts = _.split(location.hash.substring(1), '-')
    const hashPrimaryId = parseInt(hashParts[1], 10)

    switch (hashParts[0]) {
    case 'comment': {
      if (!isFeedsLoading && !this.foundCommentInFeeds(feeds, hashPrimaryId)) {
        this.loadAllFeeds()
      }
      break
    }

    case 'feed': {
      if (!isFeedsLoading && !_.some(feeds, { id: hashPrimaryId})) {
        this.loadAllFeeds()
      }
      break
    }

    case 'phase': {
      const postId = parseInt(hashParts[3], 10)

      if (phases && phasesTopics) {
        if (!_.some(phases, { id: hashPrimaryId})) {
          let existingUserIds = _.map(project.members, 'userId')
          existingUserIds= _.union(existingUserIds, _.map(project.invites, 'userId'))
          loadProjectPlan(project.id, existingUserIds)
        } else if(postId && !(phasesTopics[hashPrimaryId].topic && phasesTopics[hashPrimaryId].topic.postIds.includes(postId))) {
          loadPhaseFeed(project.id, hashPrimaryId)
        }
      }
      break
    }
    }
  }

  loadAllFeeds() {
    const { canAccessPrivatePosts, loadDashboardFeeds, loadProjectMessages, project } = this.props

    loadDashboardFeeds(project.id)
    canAccessPrivatePosts && loadProjectMessages(project.id)
  }

  foundCommentInFeeds(feeds, commentId) {
    let commentFound = false

    _.forEach(feeds, feed => _.forEach(feed.posts, post => {
      if (post.id === commentId) {
        commentFound = true
        return false
      }
    }))

    return commentFound
  }

  onChangeStatus(projectId, status, reason) {
    const delta = {status}
    if (reason && status === PROJECT_STATUS_CANCELLED) {
      delta.cancelReason = reason
    }
    this.props.updateProject(projectId, delta)
  }

  onAddNewLink(link) {
    const { updateProject, project } = this.props
    updateProject(project.id, {
      bookmarks: update(project.bookmarks || [], { $push: [link] })
    })
  }

  onDeleteLink(idx) {
    const { updateProject, project } = this.props
    updateProject(project.id, {
      bookmarks: update(project.bookmarks, { $splice: [[idx, 1]] })
    })
  }

  onEditLink(idx, title, address) {
    const { updateProject, project } = this.props
    const updatedLink = {
      title,
      address
    }
    updateProject(project.id, {
      bookmarks: update(project.bookmarks, { $splice: [[idx, 1, updatedLink]] })
    })
  }

  onEditAttachment(attachmentId, title, allowedUsers) {
    const { project, updateProjectAttachment } = this.props
    const updatedAttachment = {
      title,
      allowedUsers
    }
    const attachment = project.attachments.find(attachment => attachment.id === attachmentId)
    if (attachment) {
      updateProjectAttachment(project.id,
        attachment.id,
        updatedAttachment
      )
    }
  }

  removeAttachment(attachmentId) {
    const { project } = this.props
    this.props.removeProjectAttachment(project.id, attachmentId)
  }

  onDeleteProject() {
    const { deleteProject, project } = this.props
    deleteProject(project.id)
  }

  onAddFile() {
  }

  onUploadAttachment(attachment) {
    const { project } = this.props
    this.props.uploadProjectAttachments(project.id, attachment)
  }

  onSubmitForReview() {
    const { updateProject, project } = this.props
    updateProject(project.id, { status: 'in_review'})
  }

  extractHtmlLink(str) {
    const links = []
    const regex = /<a[^>]+href="(.*?)"[^>]*>([\s\S]*?)<\/a>/gm
    const urlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm // eslint-disable-line no-useless-escape
    const rawLinks = regex.exec(str)

    if (Array.isArray(rawLinks)) {
      let i = 0
      while (i < rawLinks.length) {
        const title = rawLinks[i + 2]
        const address = rawLinks[i + 1]

        if (urlRegex.test(address)) {
          links.push({
            title,
            address
          })
        }

        i = i + 3
      }
    }

    return links
  }

  extractMarkdownLink(str) {
    const links = []
    const regex = /(?:__|[*#])|\[(.*?)\]\((.*?)\)/gm
    const urlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm // eslint-disable-line no-useless-escape
    const rawLinks = regex.exec(str)

    if (Array.isArray(rawLinks)) {
      let i = 0
      while (i < rawLinks.length) {
        const title = rawLinks[i + 1]
        const address = rawLinks[i + 2]

        if (urlRegex.test(address)) {
          links.push({
            title,
            address
          })
        }

        i = i + 3
      }
    }

    return links
  }

  extractRawLink(str) {
    let links = []
    const regex = /(\s|^)(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}[\s])(\s|$)/igm // eslint-disable-line no-useless-escape
    const rawLinks = str.match(regex)

    if (Array.isArray(rawLinks)) {
      links = rawLinks
        .filter(link => !link.includes(']'))
        .map(link => {
          const name = link.trim()
          const url = !/^https?:\/\//i.test(name) ? 'http://' + name : name

          return {
            title: name,
            address: url
          }
        })
    }

    return links
  }

  extractLinksFromPosts(feeds) {
    const links = []
    feeds.forEach(feed => {
      let childrenLinks = []
      feed.posts.forEach(post => {
        childrenLinks = childrenLinks.concat([
          ...this.extractHtmlLink(post.rawContent),
          ...this.extractMarkdownLink(post.rawContent),
          ...this.extractRawLink(post.rawContent)
        ])
      })

      if (childrenLinks.length > 0) {
        links.push({
          id: feed.id,
          title: feed.title,
          children: childrenLinks
        })
      }
    })

    return links
  }

  getFileAttachmentName(originalFileName) {
    return /^.*.\/[^_]+_(.*.)$/.exec(originalFileName)[1]
  }

  extractAttachmentLinksFromPosts(feeds) {
    const attachmentLinks = []
    feeds.forEach(feed => {
      const attachmentLinksPerFeed = []
      feed.posts.forEach(post => {
        post.attachments.forEach(attachment => {
          attachmentLinksPerFeed.unshift({
            title: this.getFileAttachmentName(attachment.originalFileName),
            address: `/projects/messages/attachments/${attachment.id}`,
            attachmentId: attachment.id,
            attachment: true,
            deletable: true,
            createdBy: attachment.createdBy,
            postId: post.id,
            topicId: feed.id,
            topicTag: feed.tag
          })
        })
      })

      if (attachmentLinksPerFeed.length > 0) {
        attachmentLinks.push({
          id: feed.id,
          title: feed.title,
          children: attachmentLinksPerFeed
        })
      }
    })

    return attachmentLinks
  }

  deletePostAttachment({ topicId, postId, attachmentId, topicTag }) {
    const { feeds, phasesTopics, saveFeedComment } = this.props

    let feed
    if (topicTag === 'PRIMARY') {
      feed = feeds.find(feed => feed.id === topicId)
    } else {
      const phaseFeeds = Object.keys(phasesTopics)
        .map(key => phasesTopics[key].topic)
      feed = phaseFeeds.find(feed => feed.id && feed.id === topicId)
    }
    if (feed) {
      const post = feed.posts.find(post => post.id === postId)
      if (post) {
        const attachments = post.attachments
          .filter(attachment => attachment.id !== attachmentId)
        const attachmentIds = attachments.map(attachment => attachment.id)
        saveFeedComment(topicId, feed.tag, {
          id: postId,
          content: post.rawContent,
          attachmentIds
        })
      }
    }
  }

  processUploadedFiles(fpFiles, category) {
    const { onAddingNewLink } = this.props
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
    this.onUploadAttachment(attachments)
  }

  onAddingAttachmentPermissions(allowedUsers) {
    const { addProjectAttachment, attachmentsAwaitingPermission } = this.props
    const { attachments, projectId } = attachmentsAwaitingPermission
    _.forEach(attachments, f => {
      const attachment = {
        ...f,
        allowedUsers
      }
      addProjectAttachment(projectId, attachment)
    })
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
    const { project, currentMemberRole, isSuperUser, phases, feeds, isManageUser, phasesTopics, attachmentsAwaitingPermission, addProjectAttachment, discardAttachments, attachmentPermissions, changeAttachmentPermission, projectMembers, loggedInUser, isSharingAttachment, canAccessPrivatePosts } = this.props
    let directLinks = null
    // check if direct links need to be added
    const isMemberOrCopilot = _.indexOf([PROJECT_ROLE_COPILOT, PROJECT_ROLE_MANAGER], currentMemberRole) > -1
    if (isMemberOrCopilot || isSuperUser) {
      directLinks = []
      if (project.directProjectId) {
        directLinks.push({name: 'Project in Topcoder Direct', href: `${DIRECT_PROJECT_URL}${project.directProjectId}`})
      } else {
        directLinks.push({name: 'Direct project not linked. Contact support.', href: 'mailto:support@topcoder.com'})
      }
      directLinks.push({name: 'Salesforce Lead', href: `${SALESFORCE_PROJECT_LEAD_LINK}${project.id}`})
    }

    const canManageLinks = !!currentMemberRole || isSuperUser

    let devices = []
    const primaryTarget = _.get(project, 'details.appDefinition.primaryTarget')
    if (primaryTarget && !primaryTarget.seeAttached) {
      devices.push(primaryTarget.value)
    } else {
      devices = _.get(project, 'details.devices', [])
    }

    let attachments = project.attachments
    // merges the product attachments to show in the links menu
    if (phases && phases.length > 0) {
      phases.forEach(phase => {
        if (phase.products && phase.products.length > 0) {
          phase.products.forEach(product => {
            if (product.attachments && product.attachments.length > 0) {
              attachments = attachments.concat(product.attachments)
            }
          })
        }
      })
    }
    attachments = _.sortBy(attachments, attachment => -new Date(attachment.updatedAt).getTime())
      .map(attachment => ({
        id: attachment.id,
        title: attachment.title,
        address: attachment.downloadUrl,
        allowedUsers: attachment.allowedUsers,
        createdBy : attachment.createdBy
      }))

    // get list of phase topic in same order as phases
    // note: for old projects which doesn't have phases we return an empty array
    const visiblePhases = phases && phases.filter((phase) => (
      isSuperUser || isManageUser || phase.status !== PHASE_STATUS_DRAFT
    )) || []

    const phaseFeeds = _.compact(
      visiblePhases.map((phase) => {
        const topic = _.get(phasesTopics, `[${phase.id}].topic`)

        if (!topic) {
          return null
        }

        return ({
          ...topic,
          phaseId: phase.id,
          phaseName: phase.name,
        })
      })
    )

    const attachmentsStorePath = `${PROJECT_ATTACHMENTS_FOLDER}/${project.id}/`

    // extract links from posts
    const topicLinks = this.extractLinksFromPosts(feeds)
    const publicTopicLinks = topicLinks.filter(link => link.tag !== PROJECT_FEED_TYPE_MESSAGES)
    const privateTopicLinks = topicLinks.filter(link => link.tag === PROJECT_FEED_TYPE_MESSAGES)
    const phaseLinks = this.extractLinksFromPosts(phaseFeeds)

    let links = []
    links = links.concat(project.bookmarks)
    links = links.concat(publicTopicLinks)
    if (canAccessPrivatePosts) {
      links = links.concat(privateTopicLinks)
    }
    links = links.concat(phaseLinks)

    // extract attachment from posts
    attachments = [
      ...attachments,
      ...this.extractAttachmentLinksFromPosts(feeds),
      ...this.extractAttachmentLinksFromPosts(phaseFeeds)
    ]

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
            <FilesExplorer
              links={attachments}
              title="Files"
              onDelete={this.removeAttachment}
              onEdit={this.onEditAttachment}
              onAddNewLink={this.onAddFile}
              onAddAttachment={addProjectAttachment}
              onUploadAttachment={this.onUploadAttachment}
              isSharingAttachment={isSharingAttachment}
              discardAttachments={discardAttachments}
              onChangePermissions={changeAttachmentPermission}
              selectedUsers={attachmentPermissions}
              projectMembers={projectMembers}
              pendingAttachments={attachmentsAwaitingPermission}
              loggedInUser={loggedInUser}
              moreText="view all files"
              noDots
              attachmentsStorePath={attachmentsStorePath}
              onDeletePostAttachment={this.deletePostAttachment}
            />
          }
          {selectedTab === 'links' &&
            <LinksExplorer
              links={links}
              canDelete={canManageLinks}
              canEdit={canManageLinks}
              canAdd={canManageLinks}
              onAddNewLink={this.onAddNewLink}
              onDelete={this.onDeleteLink}
              onEdit={this.onEditLink}
            />
          }
        </div>
      </div>
    )
  }
}

AssetsLibrary.propTypes = {
  project: PropTypes.object.isRequired,
  loggedInUser: PropTypes.object.isRequired,
  uploadProjectAttachments: PropTypes.func.isRequired,
}

export default uncontrollable(AssetsLibrary, {
  linkToDelete: 'onDeleteIntent',
  linkToEdit: 'onEditIntent',
  isAddingNewLink: 'onAddingNewLink',
  isAddingNewFile: 'isAddingNewFile',
  limit: 'onChangeLimit'
})