import { component$ } from '@builder.io/qwik'
import type { GetPostById } from '../../../procedures/posts'
import PostItem from '../../global/PostItem'

interface Props {
  parentPost: GetPostById
}

const ParentPost = component$(({ parentPost }: Props) => {
  return (
    <>
      {parentPost.parentPost && <ParentPost parentPost={parentPost.parentPost} />}
      <PostItem post={parentPost} isInReplyTree />
    </>
  )
})

export default ParentPost
