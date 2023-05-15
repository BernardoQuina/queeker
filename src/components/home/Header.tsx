import { component$ } from '@builder.io/qwik'

export default component$(() => {
  return (
    <header class="fixed z-[10] left-0 flex w-full justify-center">
      <div class="w-[600px] max-w-full border-b-[1px] border-x-[1px] bg-white bg-opacity-50 px-3 backdrop-blur-lg dark:bg-blue-1100 dark:bg-opacity-50">
        <h1 class="font-semibold text-xl py-3">Home</h1>
      </div>
    </header>
  )
})
