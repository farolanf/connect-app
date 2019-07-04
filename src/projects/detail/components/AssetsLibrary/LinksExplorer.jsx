import React from 'react'
import PropTypes from 'prop-types'
import  { Link } from 'react-router-dom'
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

const LinksMenu = ({
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
  const renderLink = (link) => {
    if (link.onClick) {
      return (
        <a
          href={link.address}
          onClick={(evt) => {
            // we only prevent default on click,
            // as we handle clicks with <li>
            if (!link.allowDefaultOnClick) {
              evt.preventDefault()
            }
          }}
        >
          {link.title}
        </a>
      )
    } else if (link.noNewPage) {
      return <Link to={link.address}>{link.title}</Link>
    } else {
      return <a href={link.address} target="_blank" rel="noopener noreferrer">{link.title}</a>
    }
  }

  return (
    <Explorer entries={links} />
  )
}

LinksMenu.propTypes = {
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

LinksMenu.defaultProps = {
  limit: 5,
  moreText: 'load more',
  title: 'Links',
}

export default uncontrollable(LinksMenu, {
  linkToDelete: 'onDeleteIntent',
  linkToEdit: 'onEditIntent',
  isAddingNewLink: 'onAddingNewLink',
  limit: 'onChangeLimit'
})
