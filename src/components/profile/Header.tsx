import { component$ } from '@builder.io/qwik'
import { LuArrowLeft } from '@qwikest/icons/lucide'
import { useNavigate, useLocation } from '@builder.io/qwik-city'

import type { User } from '../../db/schema'
import Button from '../Button'

interface Props {
  user: User
}

export default component$(({ user }: Props) => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <header class="fixed left-0 z-[10] flex w-full justify-center">
      <div class="flex w-[600px] max-w-full items-center border-x-[1px] border-b-[1px] bg-white bg-opacity-50 px-3 py-3 backdrop-blur-lg dark:bg-blue-1100 dark:bg-opacity-50">
        <Button
          variant="ghost"
          class="flex h-10 w-10 items-center justify-center rounded-full text-2xl"
          onClick$={async () => {
            const previousDomain = document.referrer?.split('/')[2]

            if (previousDomain === location.url.host) {
              history.back()
            } else {
              await navigate('/')
            }
          }}
        >
          <LuArrowLeft />
        </Button>
        <h1 class="ml-6 text-xl font-semibold">
          {user.displayName ?? `@${user.username}`}
        </h1>
      </div>
    </header>
  )
})
