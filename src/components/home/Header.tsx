import { component$ } from '@builder.io/qwik'

export default component$(() => {
  return (
    <header class="fixed left-0 z-[10] flex w-full justify-center">
      <div class="w-[600px] max-w-full border-x-[1px] border-b-[1px] bg-white bg-opacity-50 px-3 backdrop-blur-lg dark:bg-blue-1100 dark:bg-opacity-50">
        <h1 class="py-3 text-xl font-semibold">Home</h1>
      </div>
    </header>
  )
})
