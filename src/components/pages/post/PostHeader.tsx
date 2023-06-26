import { component$ } from '@builder.io/qwik'
import { Image } from '@unpic/qwik'

import type { User } from '../../../db/schema'

interface Props {
  user: User | null
}

export default component$(({ user }: Props) => {
  if (!user) return null

  return (
    <section class="p-3">
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
  )
})
