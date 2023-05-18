import { type PropFunction, component$ } from '@builder.io/qwik'
import { LuRotateCcw } from '@qwikest/icons/lucide'

import Button from './Button'

interface Props {
  message?: string
  retryHref?: string
  retryAction?: PropFunction<() => void>
}

export default component$(({ message, retryAction, retryHref }: Props) => {
  return (
    <div class="mt-4 flex flex-col items-center self-center">
      <h4 class="mb-2 text-xl font-semibold">Error</h4>
      <p class="text-stone-500 dark:text-gray-400">
        {message ?? 'Oops, something went wrong. Please try again later.'}
      </p>

      {retryAction ? (
        <Button
          onClick$={retryAction}
          class="mt-5 flex w-[8.5rem] items-center justify-center py-2"
        >
          <div class="text-xl text-white">
            <LuRotateCcw />
          </div>
          <span class="ml-2 font-medium text-white">Try again</span>
        </Button>
      ) : (
        <a href={retryHref ?? '/'}>
          <Button class="mt-5 flex w-[8.5rem] items-center justify-center py-2">
            <div class="text-xl text-white">
              <LuRotateCcw />
            </div>
            <span class="ml-2 font-medium text-white">Try again</span>
          </Button>
        </a>
      )}
    </div>
  )
})
