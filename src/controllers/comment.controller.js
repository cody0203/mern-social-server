import { get, uniq } from 'lodash';
import Post from '../models/post.model';
import User from '../models/user.model';
import Comment from '../models/comment.model';
import errorHandler from '../helpers/dbErrorHandler';

import { socketEmitEvent } from '../helpers/socketEmitEvent';

import { commentPopulateQuery, postPopulateQuery } from '../helpers/populateQuery';

const createComment = async (req, res, next) => {
  try {
    const ownerId = get(req, 'auth._id');
    const content = get(req, 'body.content');
    const post = get(req, 'post');
    const postId = get(post, '_id');
    const comment = new Comment({ content: content, owner: ownerId, postId });
    await comment.save();
    const commentId = get(comment, '_id');
    post.comments.push(commentId);
    await post.save();
    await post.populate(postPopulateQuery).execPopulate();
    socketEmitEvent({ ownerId, eventName: 'create-comment', eventData: { action: 'created', data: post } });

    return res.status(200).json({ message: 'Successfully' });
  } catch (err) {
    return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const likeComment = async (req, res, next) => {
  try {
    const userId = get(req, 'auth._id');
    const comment = get(req, 'comment');
    const postId = get(comment, 'postId');
    let likedBy = [...comment.likes];

    const isLiked = likedBy.find((like) => like.toString() === userId.toString());
    if (!isLiked) {
      likedBy.push(userId);
    }
    if (isLiked) {
      likedBy = likedBy.filter((like) => like.toString() !== userId.toString());
    }
    comment.likes = uniq(likedBy);
    await comment.save();
    const post = await Post.findById(postId).populate(postPopulateQuery).exec();
    socketEmitEvent({ ownerId: userId, eventName: 'like-comment', eventData: { action: 'created', data: post } });

    return res.status(200).json({ message: 'Successfully' });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = get(req, 'comment');
    const ownerId = get(comment, 'owner._id');
    const commentId = get(comment, '_id');
    const postId = get(comment, 'postId');
    await Comment.deleteOne({ _id: commentId });

    const post = await Post.findByIdAndUpdate(postId, {
      $pull: { comments: commentId },
    })
      .populate(postPopulateQuery)
      .exec();
    // const post = await Post.findById(postId).populate(postPopulateQuery).exec();

    socketEmitEvent({ ownerId, eventName: 'delete-comment', eventData: { action: 'deleted', data: post } });

    return res.status(200).json({ message: 'Comment deleted' });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const editComment = async (req, res, next) => {
  try {
    const comment = get(req, 'comment');
    const ownerId = get(comment, 'owner._id');
    const postId = get(comment, 'postId');
    const { content } = get(req, 'body');

    comment.content = content;
    await comment.save();

    const post = await Post.findById(postId).populate(postPopulateQuery).exec();
    socketEmitEvent({ ownerId, eventName: 'edit-comment', eventData: { action: 'deleted', data: post } });

    return res.status(200).json({ data: post });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const createReply = async (req, res, next) => {
  try {
    const comment = get(req, 'comment');
    const commentId = get(req, 'comment._id');
    const isReply = get(req, 'comment.commentId');
    const postId = get(req, 'comment.postId');
    const content = get(req, 'body.content');
    const ownerId = get(req, 'auth._id');

    if (isReply) {
      return res.status(400).json({ error: "You can't create reply" });
    }
    const reply = new Comment({
      content: content,
      owner: ownerId,
      commentId: commentId,
      postId: postId,
    });
    await reply.save();
    const replyId = get(reply, '_id');
    comment.replies.push(replyId);
    await comment.save();

    const post = await Post.findById(postId).populate(postPopulateQuery).exec();

    socketEmitEvent({ ownerId, eventName: 'create-reply', eventData: { action: 'created', data: post } });

    return res.status(200).json({ message: 'Successfully' });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const deleteReply = async (req, res, next) => {
  try {
    const reply = get(req, 'comment');
    const ownerId = get(reply, 'owner._id');
    const replyId = get(reply, '_id');
    const commentId = get(reply, 'commentId');
    const postId = get(reply, 'postId');

    await Comment.deleteOne({ _id: replyId });
    await Comment.findByIdAndUpdate(commentId, { $pull: { replies: replyId } });

    const post = await Post.findById(postId).populate(postPopulateQuery).exec();
    socketEmitEvent({ ownerId, eventName: 'delete-reply', eventData: { action: 'created', data: post } });

    return res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const commentById = async (req, res, next, id) => {
  try {
    const comment = await Comment.findById(id).populate(commentPopulateQuery).exec();

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    req.comment = comment;
    next();
  } catch (err) {
    console.log(err);

    return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const isPoster = async (req, res, next) => {
  try {
    const target = get(req, 'comment');

    const isPoster = req.auth && target && get(req, 'auth._id').toString() === get(target, 'owner._id').toString();

    if (!isPoster) {
      return res.status(403).json({ error: 'User is not authorized' });
    }

    next();
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

export default {
  createComment,
  commentById,
  likeComment,
  deleteComment,
  isPoster,
  createReply,
  deleteReply,
  editComment,
};
