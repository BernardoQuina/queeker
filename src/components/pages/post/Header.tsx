import { component$ } from '@builder.io/qwik'
import { LuArrowLeft } from '@qwikest/icons/lucide'
import { useNavigate, useLocation } from '@builder.io/qwik-city'
import { Image } from '@unpic/qwik'

import type { User } from '../../../db/schema'
import Button from '../../global/Button'

interface Props {
  user: User | null
}

export default component$(({ user }: Props) => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <>
      <header class="fixed left-0 z-[10] flex w-full justify-center">
        <div class="flex w-[600px] max-w-full items-center border-x-[1px] border-b-[1px] bg-white bg-opacity-50 px-3 py-3 backdrop-blur-lg dark:bg-blue-1100 dark:bg-opacity-50">
          <Button
            variant="ghost"
            class="flex h-10 w-10 items-center justify-center rounded-full text-2xl"
            aria-label="go back"
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
          <h1 class="ml-6 text-xl font-semibold">Queek</h1>
        </div>
      </header>
      {user && (
        <section class="mt-[4.2rem] p-3">
          <a class="flex w-fit" href={`/${user.username}`}>
            <Image
              src={user.image}
              alt="user avatar"
              layout="constrained"
              width={48}
              height={48}
              class="rounded-full"
            />
            <div class="ml-3 flex flex-col justify-center">
              <span class="font-semibold hover:underline">{user.displayName}</span>
              <span class="truncate break-words leading-[15px] text-stone-500 dark:text-gray-400">
                @{user.username}
              </span>
            </div>
          </a>
        </section>
      )}
    </>
  )
})
