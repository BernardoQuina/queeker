import { component$, useSignal } from '@builder.io/qwik'
import { Form, useLocation } from '@builder.io/qwik-city'
import { LuLogOut, LuSun, LuMoon } from '@qwikest/icons/lucide'

import { useAuthSession, useAuthSignin, useAuthSignout } from '../../routes/plugin@auth'
import { toggleTheme } from '../../utils/toggleTheme'
import { GitHubLogo } from '../global/icons/GithubLogo'

import Button from './Button'

interface Props {
  initialTheme: 'light' | 'dark'
}

export default component$(({ initialTheme }: Props) => {
  const session = useAuthSession()
  const signIn = useAuthSignin()
  const signOut = useAuthSignout()

  const theme = useSignal(initialTheme)

  const location = useLocation()

  return (
    <footer class="fixed bottom-0 z-[10] flex h-16 w-full justify-center border-t-[1px] bg-white bg-opacity-50 px-3 backdrop-blur-lg dark:bg-blue-1100 dark:bg-opacity-50">
      <div class="flex h-16 w-[600px] max-w-full items-center justify-between">
        <div class="flex">
          <Button
            variant="ghost"
            class="h-10 w-10 items-center justify-center text-xl"
            onClick$={() => (theme.value = toggleTheme())}
            aria-label="toggle theme"
          >
            {theme.value === 'light' ? <LuSun /> : <LuMoon />}
          </Button>
          {session.value?.user ? (
            <Form id="signout" action={signOut} class="ml-3">
              <input type="hidden" name="callbackUrl" value="/" />
              <Button
                type="submit"
                class="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                variant="ghost"
                aria-label="sign out"
              >
                <LuLogOut />
              </Button>
            </Form>
          ) : (
            <Form id="signin" action={signIn} class="ml-3">
              <input type="hidden" name="providerId" value="github" />
              <input
                type="hidden"
                name="options.callbackUrl"
                value={location.url.origin}
              />
              <Button
                type="submit"
                class="flex h-10 items-center px-6 sm:px-10"
                variant="outline"
                aria-label="sign in"
              >
                <GitHubLogo />
                <p class="ml-3 font-medium">Sign in</p>
                <p class="ml-1 hidden font-medium sm:block">with GitHub</p>
              </Button>
            </Form>
          )}
        </div>
        <div class="flex flex-col items-end">
          <span class="-mb-1">made by</span>
          <a
            href="https://twitter.com/bernardoquina"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-1 flex items-center text-blue-550 hover:underline"
          >
            @bernardoquina
          </a>
        </div>
      </div>
    </footer>
  )
})
