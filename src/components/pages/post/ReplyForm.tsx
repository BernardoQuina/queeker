import { type Signal, $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { server$ } from '@builder.io/qwik-city'
import { Image } from '@unpic/qwik'
import type { DefaultSession } from '@auth/core/types'
import { useCSSTransition } from 'qwik-transition'

import Button from '../../global/Button'
import Spinner from '../../global/Spinner'
import Toast from '../../global/Toast'
import { api } from '../../../api'
import type { AddPostInput, GetManyPosts, GetPostById } from '../../../api/posts'
import CircularProgress from '../../global/CircularProgress'

const replyToPost = server$(async function ({ content, replyToPostId }: AddPostInput) {
  return api(this).posts.mutation.add({ content, replyToPostId })
})

interface Props {
  replies: GetManyPosts
  user?: DefaultSession['user']
  post: GetPostById
  textareaRef: Signal<HTMLTextAreaElement | undefined>
}

export default component$(({ replies, user, post, textareaRef }: Props) => {
  const content = useSignal('')
  const inputFocused = useSignal(false)

  const charLimit = 280
  const charLeft = charLimit - content.value.length

  const loading = useSignal(false)
  const errorMessage = useSignal('')
  const toastVisible = useSignal(false)

  // enterFrom animation wasn't working w/ shouldMount and transitionOnAppear so that was left out
  const { stage } = useCSSTransition(toastVisible, { timeout: 300 })

  useVisibleTask$(({ cleanup }) => {
    const setHeight = () => {
      if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
        textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
      }
    }
    textareaRef.value?.addEventListener('input', setHeight)

    const focus = () => (inputFocused.value = true)
    textareaRef.value?.addEventListener('focus', focus)

    const blur = () => {
      inputFocused.value = false

      if (content.value.length === 0) {
        textareaRef.value?.style.removeProperty('height')
      }
    }
    textareaRef.value?.addEventListener('blur', blur)

    cleanup(() => {
      textareaRef.value?.removeEventListener('input', setHeight)
      textareaRef.value?.removeEventListener('focus', focus)
      textareaRef.value?.removeEventListener('blur', blur)
    })
  })

  if (!user) return null

  return (
    <form
      onSubmit$={async () => {
        loading.value = true

        const newPost = await replyToPost({
          content: content.value,
          replyToPostId: post.id,
        })

        if (newPost.code !== 200 || !newPost.data) {
          loading.value = false

          errorMessage.value = newPost.message
          toastVisible.value = true

          return
        }

        loading.value = false

        content.value = ''

        post.replyCount = (parseInt(post.replyCount) + 1).toString()
        replies.unshift(newPost.data)
      }}
      preventdefault:submit
      class="flex border-t-[1px]"
    >
      <Image
        src={user.image ?? ''}
        alt="user avatar"
        layout="constrained"
        width={48}
        height={48}
        class="mb-1 mt-4 h-[48px] w-[48px] rounded-full"
      />

      <textarea
        id="tweet"
        ref={textareaRef}
        bind:value={content}
        placeholder="Qweek your reply!"
        class="mt-5 flex-grow resize-none overflow-hidden bg-transparent px-3 pt-2 text-xl focus:outline-none"
        rows={1}
      />
      <div class="flex flex-col justify-between">
        <Button
          disabled={
            loading.value ||
            content.value.length === 0 ||
            content.value.length > charLimit
          }
          type="submit"
          class="mt-[1.4rem] h-10 w-[5.5rem] font-semibold"
          aria-label="post"
        >
          {loading.value ? <Spinner /> : 'Reply'}
        </Button>
        {inputFocused.value || content.value.length > 0 ? (
          <div class="mt-3 flex">
            <CircularProgress current={content.value.length} />
            <span
              class={`${
                charLeft <= 0
                  ? 'text-red-600'
                  : charLeft <= 20
                  ? 'text-yellow-400'
                  : 'text-stone-500 dark:text-gray-400'
              } ml-2`}
            >
              {charLeft}
            </span>
          </div>
        ) : null}
      </div>
      <Toast
        stage={stage}
        message={errorMessage.value}
        onClose={$(() => (toastVisible.value = false))}
      />
    </form>
  )
})
