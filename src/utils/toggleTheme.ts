// This function can only run in the browser
export const toggleTheme = () => {
  const theme = document.cookie.split('; ').find((row) => row.startsWith('theme='))
  const themeValue = theme?.split('=')[1]

  if (themeValue === 'light') {
    document.cookie = 'theme=dark'

    const layout = document.getElementById('layout')
    layout?.classList.add('dark')
    layout?.classList.remove('light')
  } else {
    document.cookie = 'theme=light'

    const layout = document.getElementById('layout')
    layout?.classList.add('light')
    layout?.classList.remove('dark')
  }
}
