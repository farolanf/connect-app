import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import './CardListHeader.scss'

const CardListHeader = ({
  title,
  privateCount,
  filter,
  onClickAll,
  onClickAdminOnly
}) => (
  <div styleName="container">
    <span styleName="title">{title}</span>
    <div>
      <span styleName={cn('filter-btn', filter === 'all' && 'active')} onClick={onClickAll}>All</span>
      <span styleName={cn('filter-btn', filter === 'private' && 'active')}>
        Admin Only
        <span styleName="filter-badge" onClick={onClickAdminOnly}>
          {privateCount}
        </span>
      </span>
    </div>
  </div>
)

CardListHeader.defaultProps = {
  privateCount: 0,
  filter: 'all'
}

CardListHeader.propTypes = {
  title: PropTypes.string,
  privateCount: PropTypes.number,
  filter: PropTypes.oneOf(['all', 'private']),
  onClickAll: PropTypes.func,
  onClickAdminOnly: PropTypes.func
}

export default CardListHeader