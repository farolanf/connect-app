import React from 'react'

import TwoColsLayout from '../../../components/TwoColsLayout'
import AssetsLibrary from '../components/AssetsLibrary'

import './AssetsLibraryContainer.scss'

const AssetsLibraryContainer = props => (
  <TwoColsLayout>
    <TwoColsLayout.Sidebar>
    </TwoColsLayout.Sidebar>
    <TwoColsLayout.Content>
      <AssetsLibrary {...props} />
    </TwoColsLayout.Content>
  </TwoColsLayout>
)

export default AssetsLibraryContainer