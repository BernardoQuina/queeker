import { component$, Slot } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'

import Footer from '../components/global/Footer'

export const useThemeLoader = routeLoader$((reqEvent) => {
  const theme = reqEvent.cookie.get('theme')

  if (!theme) {
    reqEvent.cookie.set('theme', 'dark', { path: '/' })

    return { theme: 'dark' as const }
  }

  return { theme: theme.value as 'dark' | 'light' }
})

export default component$(() => {
  const theme = useThemeLoader()

  return (
    <div id="layout" class={theme.value.theme}>
      {theme.value.theme === 'dark' && (
        <style
          dangerouslySetInnerHTML={`
            html {
              color-scheme: dark;
            }
          `}
        />
      )}
      <main class="flex min-h-screen flex-col bg-white dark:bg-blue-1100">
        <Slot />
      </main>
      <Footer initialTheme={theme.value.theme} />
    </div>
  )
})
