import React from 'react'
import PropTypes from 'prop-types'
import  { Link } from 'react-router-dom'
import Modal from 'react-modal'

import Panel from '../../../../components/Panel/Panel'
import AddLink from '../../../../components/LinksMenu/AddLink'
import DeleteLinkModal from '../../../../components/LinksMenu/DeleteLinkModal'
import EditLinkModal from '../../../../components/LinksMenu/EditLinkModal'
import LinksMenuAccordion from '../../../../components/LinksMenu/LinksMenuAccordion'
import uncontrollable from 'uncontrollable'
import MobileExpandable from '../../../../components/MobileExpandable/MobileExpandable'
import cn from 'classnames'
import BtnRemove from '../../../../assets/icons/ui-16px-1_trash-simple.svg'
import BtnEdit from '../../../../assets/icons/icon-edit.svg'
import Explorer from './Explorer'

import './LinksExplorer.scss'

const LinksExplorer = ({
  canAdd,
  canDelete,
  canEdit,
  noDots,
  isAddingNewLink,
  limit,
  links,
  linkToDelete,
  linkToEdit,
  onAddingNewLink,
  onAddNewLink,
  onChangeLimit,
  onDelete,
  onDeleteIntent,
  onEdit,
  onEditIntent,
  title,
  moreText,
  withHash,
}) => {
  return (
    <div>
      <Modal
        isOpen={isAddingNewLink}
        onRequestClose={onAddingNewLink}
        contentLabel="Add Link"
        overlayClassName="links-explorer__add-link__modal-overlay"
        className="links-explorer__add-link__modal-content"
        shouldCloseOnEsc
        shouldCloseOnOverlayClick
      >
        <AddLink
          onAdd={(link) => {
            if (link.address.indexOf('http') !== 0)
              link.address = `http://${link.address}`
            onAddNewLink(link)
            onAddingNewLink(false)
          }}
          onClose={() => {
            onAddingNewLink(false)
          }}
        />
      </Modal>
      <Explorer entries={links} />
    </div>
  )
}

LinksExplorer.propTypes = {
  canAdd: PropTypes.bool,
  canDelete: PropTypes.bool,
  canEdit: PropTypes.bool,
  noDots: PropTypes.bool,
  limit: PropTypes.number,
  links: PropTypes.array.isRequired,
  moreText: PropTypes.string,
  onAddingNewLink: PropTypes.func,
  onAddNewLink: PropTypes.func,
  onChangeLimit: PropTypes.func,
  onDelete: PropTypes.func,
  title: PropTypes.string,
}

LinksExplorer.defaultProps = {
  limit: 5,
  moreText: 'load more',
  title: 'Links',
}

export default uncontrollable(LinksExplorer, {
  linkToDelete: 'onDeleteIntent',
  linkToEdit: 'onEditIntent',
  isAddingNewLink: 'onAddingNewLink',
  limit: 'onChangeLimit'
})
