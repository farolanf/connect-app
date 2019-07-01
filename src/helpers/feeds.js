import moment from 'moment'

export const sortFeedByNewestMsg = (a, b) =>
  moment(b.posts.length && b.posts[b.posts.length - 1].date).valueOf()
  - moment(a.posts.length && a.posts[a.posts.length - 1].date).valueOf()
