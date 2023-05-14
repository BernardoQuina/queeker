import { Slot, component$, type HTMLAttributes } from '@builder.io/qwik'

interface Props extends HTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'outline' | 'solid'
  type?: 'button' | 'submit' | 'reset'
}

export default component$((props: Props) => {
  const { variant = 'solid', class: className, ...otherProps } = props

  let variantStyle = ''

  if (variant === 'ghost') {
    variantStyle = `${className} flex rounded-full hover:bg-slate-600 dark:hover:bg-slate-600 hover:bg-opacity-10 dark:hover:bg-opacity-30 hover:backdrop-blur active:bg-slate-500 active:bg-opacity-20`
  }

  if (variant === 'outline') {
    variantStyle = `${className} rounded-full border-[1px] bg-opacity-60 backdrop-blur hover:bg-slate-600 dark:hover:bg-slate-600 hover:bg-opacity-10 dark:hover:bg-opacity-30 hover:backdrop-blur active:bg-slate-500 active:bg-opacity-30`
  }

  if (variant === 'solid') {
    variantStyle = `${className} rounded-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-400`
  }

  return (
    <button {...otherProps} class={variantStyle}>
      <Slot />
    </button>
  )
})
