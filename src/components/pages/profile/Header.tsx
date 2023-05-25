import { component$ } from '@builder.io/qwik'
import { LuArrowLeft } from '@qwikest/icons/lucide'
import { useNavigate, useLocation } from '@builder.io/qwik-city'
import { Image } from '@unpic/qwik'

import type { User } from '../../../db/schema'
import Button from '../../global/Button'

interface Props {
  user: User
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
          <h1 class="ml-6 text-xl font-semibold">
            {user.displayName ?? `@${user.username}`}
          </h1>
        </div>
      </header>
      <section class="mt-[4.1rem] border-b-[1px] pb-3">
        <Image
          src="https://qwik-drizzle.vercel.app/images/sql.jpeg"
          alt="banner meme"
          width={600}
          height={160}
          layout="constrained"
          class="h-40 w-full border-b-[1px] object-cover object-top sm:h-56"
        />
        <div class="relative px-3 pt-[84px]">
          <Image
            src={user.image}
            alt="user avatar"
            layout="constrained"
            width={145}
            height={145}
            class="absolute left-2 top-[-72.5px] rounded-full border-[6px] border-white dark:border-blue-1100"
          />
          {user.displayName && <h1 class="text-2xl font-semibold">{user.displayName}</h1>}
          <span class="text-stone-500 dark:text-gray-400">@{user.username}</span>
        </div>
      </section>
    </>
  )
})
