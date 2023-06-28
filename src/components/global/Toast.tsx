import { type PropFunction, type Signal, component$ } from '@builder.io/qwik'
import type { Stage } from 'qwik-transition'
import { LuX } from '@qwikest/icons/lucide'

import Button from './Button'

interface Props {
  message: string
  stage: Signal<Stage>
  onClose: PropFunction<() => boolean>
}

export default component$(({ message, stage, onClose }: Props) => {
  return (
    <div
      id="toast-simple"
      class="fixed left-[50%] top-6 z-[12] flex w-full max-w-xs items-center rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-md dark:border-blue-1000 dark:bg-gray-800"
      role="alert"
      style={{
        transition: '.3s',
        transitionProperty: 'all',
        opacity: stage.value === 'enterTo' ? 1 : 0,
        transform:
          stage.value === 'enterTo'
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(-100px)',
      }}
    >
      <div class="flex min-h-[2rem] min-w-[2rem] items-center justify-center rounded-md bg-red-100 text-xl text-red-500 dark:bg-red-600 dark:bg-opacity-60">
        <LuX />
      </div>
      <div class="mr-auto px-4 text-sm font-normal text-stone-500 dark:text-gray-400">
        {message}
      </div>
      <Button
        variant="ghost"
        class="min-h-[2.5rem] min-w-[2.5rem] items-center justify-center text-xl text-stone-500 dark:text-gray-400"
        type="button"
        aria-label="Close toast"
        onClick$={onClose}
      >
        <LuX />
      </Button>
    </div>
  )
})
