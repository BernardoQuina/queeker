import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { server$ } from '@builder.io/qwik-city'
import { Image } from '@unpic/qwik'
import type { DefaultSession } from '@auth/core/types'
import { useCSSTransition } from 'qwik-transition'

import { type PostWithUserCounts } from '../../../db/schema'
import Button from '../../global/Button'
import Spinner from '../../global/Spinner'
import Toast from '../../global/Toast'
import { procedures } from '../../../procedures'
import type { AddPostInput } from '../../../procedures/posts'

const addPost = server$(async function ({ content }: AddPostInput) {
  return procedures(this).posts.mutation.add({ content })
})

interface Props {
  posts: PostWithUserCounts[]
  user: DefaultSession['user']
}

export default component$(({ posts, user }: Props) => {
  const content = useSignal('')
  const loading = useSignal(false)

  const errorMessage = useSignal('')
  const toastVisible = useSignal(false)

  // enterFrom animation wasn't working w/ shouldMount and transitionOnAppear so that was left out
  const { stage } = useCSSTransition(toastVisible, { timeout: 300 })

  const textareaRef = useSignal<HTMLTextAreaElement>()

  useVisibleTask$(({ cleanup }) => {
    const setHeight = () => {
      if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
        textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
      }
    }

    textareaRef.value?.addEventListener('input', setHeight)

    cleanup(() => textareaRef.value?.removeEventListener('input', setHeight))
  })

  return (
    <form
      onSubmit$={async () => {
        loading.value = true

        const newPost = await addPost({ content: content.value })

        if (newPost.code !== 200 || !newPost.data) {
          loading.value = false

          errorMessage.value = newPost.message
          toastVisible.value = true

          return
        }

        loading.value = false

        content.value = ''

        posts.unshift(newPost.data)
      }}
      preventdefault:submit
      class="flex min-h-[5.25rem] border-b-[1px] px-3"
    >
      <Image
        src={user?.image ?? ''}
        alt="user avatar"
        layout="constrained"
        width={48}
        height={48}
        class="mt-4 h-[48px] w-[48px] rounded-full"
      />

      <textarea
        id="tweet"
        ref={textareaRef}
        bind:value={content}
        placeholder="What is happening?!"
        class="min-h-[5.25rem] flex-grow resize-none overflow-hidden bg-transparent px-3 pb-2 pt-7 text-xl focus:outline-none"
      />
      <Button
        disabled={loading.value || content.value.length === 0}
        type="submit"
        class="mt-[1.4rem] h-10 w-[5.5rem] font-semibold"
        aria-label="post"
      >
        {loading.value ? <Spinner /> : 'Queek'}
      </Button>
      <Toast
        stage={stage}
        message={errorMessage.value}
        onClose={$(() => (toastVisible.value = false))}
      />
    </form>
  )
})
