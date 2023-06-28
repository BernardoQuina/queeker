import { component$ } from '@builder.io/qwik'

interface Props {
  current: number
  max?: number
}

export default component$(({ current, max = 280 }: Props) => {
  const radius = 12

  const circumference = 2 * Math.PI * radius

  const progress = !current ? 0 : current > max ? 100 : (current / max) * 100

  return (
    <div
      x-data="scrollProgress"
      class="inline-flex -rotate-90 items-center justify-center overflow-hidden rounded-full"
    >
      <svg class="h-7 w-7">
        <circle
          class="text-gray-200 dark:text-slate-600"
          stroke-width="2"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="13"
          cy="13"
        />
        <circle
          class={`${
            max - current <= 0
              ? 'text-red-600'
              : current >= max - 20
              ? 'text-yellow-400'
              : 'text-blue-550'
          }`}
          stroke-width="2"
          stroke-dasharray={circumference}
          stroke-dashoffset={`${circumference - (progress / 100) * circumference}`}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="13"
          cy="13"
        />
      </svg>
    </div>
  )
})
