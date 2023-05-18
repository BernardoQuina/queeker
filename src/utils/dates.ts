import dayjs from 'dayjs'

export const timeAgo = (date: Date) => {
  const now = dayjs()
  const dateTime = dayjs(date)

  const duration = dayjs.duration(now.diff(dateTime))
  const hoursDiff = Math.floor(duration.asHours())

  let relativeTime = ''

  if (duration.asSeconds() < 10) {
    relativeTime = 'now'
  } else if (duration.asMinutes() < 1) {
    relativeTime = `${Math.floor(duration.asSeconds())}s`
  } else if (hoursDiff < 1) {
    relativeTime = `${Math.floor(duration.asMinutes())}m`
  } else if (hoursDiff < 24) {
    relativeTime = `${Math.floor(duration.asHours())}h`
  } else {
    relativeTime = dateTime.format('MMM DD')
  }

  return relativeTime
}

export const formatDate = (date: Date) => {
  const dateTime = dayjs(date)

  return dateTime.format('h:mm A · MMM DD, YYYY')
}
