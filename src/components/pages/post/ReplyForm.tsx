import { type Signal, $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { server$ } from '@builder.io/qwik-city'
import { Image } from '@unpic/qwik'
import type { DefaultSession } from '@auth/core/types'
import { useCSSTransition } from 'qwik-transition'

// import { type PostWithUserAndLikeCount } from '../../../db/schema'
import Button from '../../global/Button'
import Spinner from '../../global/Spinner'
import Toast from '../../global/Toast'
import { procedures } from '../../../procedures'
import type { AddPostInput, GetManyPosts, GetPostById } from '../../../procedures/posts'

const replyToPost = server$(async function ({ content, replyToPostId }: AddPostInput) {
  return procedures(this).posts.mutation.add({ content, replyToPostId })
})

interface Props {
  replies: GetManyPosts
  user?: DefaultSession['user']
  post: GetPostById
  textareaRef: Signal<HTMLTextAreaElement | undefined>
}

export default component$(({ replies, user, post, textareaRef }: Props) => {
  const content = useSignal('')
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

    cleanup(() => textareaRef.value?.removeEventListener('input', setHeight))
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
      <Button
        disabled={loading.value || content.value.length === 0}
        type="submit"
        class="mt-[1.4rem] h-10 w-[5.5rem] font-semibold"
        aria-label="post"
      >
        {loading.value ? <Spinner /> : 'Reply'}
      </Button>
      <Toast
        stage={stage}
        message={errorMessage.value}
        onClose={$(() => (toastVisible.value = false))}
      />
    </form>
  )
})
