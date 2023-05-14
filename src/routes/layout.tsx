import { component$, Slot } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'

import Footer from '../components/Footer'

export const useThemeLoader = routeLoader$((reqEvent) => {
  const theme = reqEvent.cookie.get('theme')

  if (!theme) {
    reqEvent.cookie.set('theme', 'dark')

    return { theme: 'dark' as const }
  }

  return { theme: theme.value as 'dark' | 'light' }
})

export default component$(() => {
  const theme = useThemeLoader()

  return (
    <div id="layout" class={theme.value.theme}>
      {theme.value.theme === 'dark' && (
        <style>
          {`
          html {
            color-scheme: dark;
          }
          `}
        </style>
      )}
      <main class="min-h-screen bg-white text-stone-950 dark:bg-blue-1000 dark:text-slate-50">
        <Slot />
      </main>
      <Footer initialTheme={theme.value.theme} />
    </div>
  )
})
