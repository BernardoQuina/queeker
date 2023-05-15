import { Slot, component$, type HTMLAttributes } from '@builder.io/qwik'

interface Props extends HTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'outline' | 'solid'
  type?: 'button' | 'submit' | 'reset'
}

export default component$((props: Props) => {
  const { variant = 'solid', class: className, ...otherProps } = props

  let variantStyle = ''

  if (variant === 'ghost') {
    variantStyle = `${className} flex rounded-full hover:bg-stone-500 dark:hover:bg-slate-200 hover:bg-opacity-[0.15] dark:hover:bg-opacity-[0.12] hover:backdrop-blur active:bg-stone-400 active:bg-opacity-30 dark:active:bg-slate-200 dark:active:bg-opacity-20`
  }

  if (variant === 'outline') {
    variantStyle = `${className} rounded-full border-[1px] bg-opacity-60 backdrop-blur hover:bg-stone-400 dark:hover:bg-slate-200 hover:bg-opacity-[0.15] dark:hover:bg-opacity-10 hover:backdrop-blur active:bg-stone-400 active:bg-opacity-30 dark:active:bg-slate-200 dark:active:bg-opacity-20`
  }

  if (variant === 'solid') {
    variantStyle = `${className} rounded-full text-white bg-blue-550 hover:bg-blue-650 active:bg-indigo-400`
  }

  return (
    <button {...otherProps} class={variantStyle}>
      <Slot />
    </button>
  )
})
