import React from 'react'

import TwoColsLayout from '../../../components/TwoColsLayout'
import AssetsLibrary from '../components/AssetsLibrary'

import './AssetsLibraryContainer.scss'

const AssetsLibraryContainer = () => (
  <TwoColsLayout>
    <TwoColsLayout.Sidebar>
    </TwoColsLayout.Sidebar>
    <TwoColsLayout.Content>
      <AssetsLibrary />
    </TwoColsLayout.Content>
  </TwoColsLayout>
)

export default AssetsLibraryContainer