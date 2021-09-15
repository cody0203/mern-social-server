import { get } from 'lodash';

export const transformPost = (post, ownerIds, allComments) => {
  const ownerId = get(post, 'owner');
  const postId = get(post, '_id');
  const owner = ownerIds.find((user) => user._id.toString() === ownerId.toString());
  post.owner = owner;
  const postComments = allComments.filter((comment) => get(comment, 'postId').toString() === postId.toString());

  return { transformedPost: post, postComments };
};
