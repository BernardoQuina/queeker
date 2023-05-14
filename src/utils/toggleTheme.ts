// This function can only run in the browser
export const getTheme = () => {
  const theme = document.cookie.split('; ').find((row) => row.startsWith('theme='))
  const themeValue = theme?.split('=')[1]

  if (themeValue === 'light') {
    return 'light'
  }

  return 'dark'
}

export const toggleTheme = () => {
  const themeValue = getTheme()

  if (themeValue === 'light') {
    document.cookie = 'theme=dark'

    const layout = document.getElementById('layout')
    layout?.classList.add('dark')
    layout?.classList.remove('light')

    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')

    return 'dark'
  } else {
    document.cookie = 'theme=light'

    const layout = document.getElementById('layout')
    layout?.classList.add('light')
    layout?.classList.remove('dark')

    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')

    return 'light'
  }
}
