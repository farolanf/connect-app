import React, { Component } from 'react'
// import PropTypes from 'prop-types'
import cn from 'classnames'

import Explorer from './Explorer'
import './AssetsLibrary.scss'

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
      selectedTab: 'files'
    }
  }

  createSelectTab(tabId) {
    return () => this.setState({ selectedTab: tabId })
  }

  render() {
    const { selectedTab } = this.state

    return (
      <div styleName="root">
        <div styleName="header">
          <h1 styleName="title">Asset Library</h1>
          <button className="tc-btn tc-btn-primary tc-btn-sm action-btn">Add New...</button>
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
            <Explorer root={{
              entries: [
                { name: 'file1.xlsx' },
                { name: 'file2.png' },
                { name: 'dir1', isFolder: true, entries: [
                  { name: 'file3.txt' },
                  { name: 'file4.txt' },
                ] },
                { name: 'dir2', isFolder: true, entries: [
                  { name: 'img1.jpg' },
                  { name: 'img2.jpg' },
                ] },
                { name: 'file5.mp4' },
                { name: 'file6.docx' },
                { name: 'file7.pdf' },
              ]
            }}
            />
          }
        </div>
      </div>
    )
  }
}

AssetsLibrary.propTypes = {
  // project: PropTypes.object.isRequired,
}

export default AssetsLibrary