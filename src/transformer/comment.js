import { get } from 'lodash';

export const transformComments = (postComments, ownerIds) => {
  const transformedComments = postComments.map((comment) => {
    const id = get(comment, '_id');
    const ownerId = get(comment, 'owner');
    const replyCommentId = get(comment, 'commentId');
    const owner = ownerIds.find((user) => user._id.toString() === ownerId.toString());
    comment.owner = owner;
    if (!replyCommentId) {
      comment.replies = postComments.filter(
        (comment) => get(comment, 'commentId') && get(comment, 'commentId').toString() === id.toString()
      );
    }
    return comment;
  });

  return transformedComments;
};
