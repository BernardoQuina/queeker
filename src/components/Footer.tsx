import { component$, useSignal } from '@builder.io/qwik'
import { Form } from '@builder.io/qwik-city'
import { LuLogOut, LuSun, LuMoon } from '@qwikest/icons/lucide'
// @qwikest/icons is causing a qwik warning of duplicate implementation of JSXNode

import { toggleTheme } from '../utils/toggleTheme'
import { useAuthSession, useAuthSignin, useAuthSignout } from '../routes/plugin@auth'
import { GitHubLogo } from './icons/GithubLogo'

interface Props {
  initialTheme: 'light' | 'dark'
}

export default component$(({ initialTheme }: Props) => {
  const session = useAuthSession()
  const signIn = useAuthSignin()
  const signOut = useAuthSignout()

  const theme = useSignal(initialTheme)

  return (
    <footer class="fixed bottom-0 flex h-16 w-full items-center bg-blue-200 text-stone-950 dark:bg-blue-900 dark:text-slate-50">
      <button
        class="flex h-10 w-10 items-center justify-center rounded-full text-xl"
        onClick$={() => (theme.value = toggleTheme())}
      >
        {theme.value === 'light' ? <LuSun /> : <LuMoon />}
      </button>
      {session.value?.user ? (
        <Form id="signout" action={signOut} class="ml-3">
          <input type="hidden" name="callbackUrl" value="/" />
          <button
            type="submit"
            class="flex h-10 w-10 items-center justify-center rounded-full text-xl"
          >
            <LuLogOut />
          </button>
        </Form>
      ) : (
        <Form id="signin" action={signIn} class="ml-3">
          <input type="hidden" name="providerId" value="github" />
          <input type="hidden" name="options.callbackUrl" value="http://127.0.0.1:5173" />
          <button type="submit" class="flex h-10 items-center rounded-full border px-10">
            <GitHubLogo />
            <p class="ml-3 font-medium">Sign in with GitHub</p>
          </button>
        </Form>
      )}
    </footer>
  )
})
