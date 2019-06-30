import moment from 'moment'

export const sortFeedByNewestMsg = (a, b) =>
  moment(b.posts.length && b.posts[0].date).valueOf()
  - moment(a.posts.length && a.posts[0].date).valueOf()
  