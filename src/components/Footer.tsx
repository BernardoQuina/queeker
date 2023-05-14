import { component$, $ } from '@builder.io/qwik'
import { toggleTheme } from '../utils/toggleTheme'

export default component$(() => {
  return (
    <footer class="fixed bottom-0" onClick$={$(toggleTheme)}>
      <h1>Footer</h1>
    </footer>
  )
})
