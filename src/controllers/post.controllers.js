import { get, extend, uniq, map, range } from 'lodash';

import Post from '../models/post.model';
import User from '../models/user.model';
import Comment from '../models/comment.model';
import errorHandler from '../helpers/dbErrorHandler';
import { postPopulateQuery } from '../helpers/populateQuery';

import { transformPost } from '../transformer/post';
import { transformComments } from '../transformer/comment';

const queryPost = async ({ query, page, limit }) => {
  const posts = await Post.find(query)
    .sort({ created: 'desc' })
    .skip((page - 1) * limit)
    .limit(limit);

  const ownerPostIds = posts.map((post) => post.owner);
  const postId = posts.map((post) => post._id);
  const allComments = await Comment.find({ postId });
  const ownerCommentIds = allComments.map((comment) => comment.owner).concat(ownerPostIds);
  const ownerIds = await User.find({ _id: { $in: ownerCommentIds } }).select('name');

  const mappingData = map(posts, (post) => {
    const { transformedPost, postComments } = transformPost(post, ownerIds, allComments);
    const transformedComments = transformComments(postComments, ownerIds);

    transformedPost.comments = transformedComments.filter((comment) => !get(comment, 'commentId'));
    return transformedPost;
  });

  const countDocs = await Post.countDocuments(query);
  const meta = {
    total: countDocs,
    current_page: page,
    per_page: limit,
    page_size: posts.length,
    total_page: Math.ceil(countDocs / limit),
  };
  return { data: mappingData, meta };

  // const data = await Post.find(query)
  //   .sort({ created: "desc" })
  //   .skip((page - 1) * limit)
  //   .limit(limit)
  //   .populate(postPopulateQuery)
  //   .exec();

  // const countDocs = await Post.countDocuments(query);

  // const meta = {
  //   total: countDocs,
  //   current_page: page,
  //   per_page: limit,
  //   page_size: data.length,
  //   total_page: Math.ceil(countDocs / limit),
  // };
  // return { data, meta };
};

const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(get(req, 'query.page')) || 1;
    const limit = parseInt(get(req, 'query.limit')) || 10;

    const userId = get(req, 'auth._id');
    const user = await User.findById(userId);
    const following = get(user, 'following');
    following.push(userId);

    const query = {
      owner: { $in: following },
      $or: [{ owner: userId }, { public: true }],
    };

    const { data, meta } = await queryPost({ query, page, limit });

    return res.status(200).json({ data: data, meta });
  } catch (err) {
    console.log(err);
    return res.status(404).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const getPost = async (req, res, next) => {
  try {
    const userId = get(req, 'profile._id');
    const page = parseInt(get(req, 'query.page')) || 1;
    const limit = parseInt(get(req, 'query.limit')) || 10;

    const query = { owner: userId };
    const { data, meta } = await queryPost({ query, page, limit });

    return res.status(200).json({ data: data, meta });
  } catch (err) {
    console.log(err);
    return res.status(404).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const createPost = async (req, res, next) => {
  try {
    const owner = get(req, 'auth._id');
    const post = new Post({ ...req.body, owner });

    const createdPost = await post.save();

    await createdPost.populate('owner', 'name').execPopulate();

    return res.status(200).json({ message: 'Successfully created post', data: createdPost });
  } catch (err) {
    console.log(err);
    return res.status(404).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const updatePost = async (req, res, next) => {
  try {
    let post = req.post;
    post = extend(post, req.body);

    await post.save();

    return res.status(200).json({ message: 'Update post successfully', data: post });
  } catch (err) {
    return res.status(404).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = req.post;
    const postId = get(post, '_id');

    await Post.deleteOne({ _id: postId });
    await Comment.deleteMany({ postId });
    return res.status(200).json({ message: 'Deleted', data: post });
  } catch (err) {
    return res.status(404).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const likePost = async (req, res, next) => {
  try {
    const userId = get(req, 'auth._id');
    const post = get(req, 'post');
    let likedBy = [...post.likes];

    const isLiked = likedBy.find((like) => like.toString() === userId.toString());
    if (!isLiked) {
      likedBy.push(userId);
    }

    if (isLiked) {
      likedBy = likedBy.filter((like) => like.toString() !== userId.toString());
    }

    post.likes = uniq(likedBy);

    await post.save();
    await post.populate('comments.poster', 'name').execPopulate();

    return res.status(200).json({ data: post });
  } catch (err) {
    return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

const genPost = async () => {
  const posts = range(1000).forEach(async (index) => {
    const post = new Post({
      content: `Post ${index}`,
      owner: '5efb4d02db01881ff82547d2',
      comments: [
        '5f0aa2402f98050a7de25764',
        '5f0c7317068ff80683d913a7',
        '5f0d7d10c2ca758c136c964f',
        '5f0d7d17c2ca758c136c9651',
      ],
      public: true,
    });
    return await post.save();
  });

  // await Promise.all(posts);
};

const isOwner = (req, res, next) => {
  const owner = req.post && req.auth && req.post.owner._id.toString() === req.auth._id.toString();

  if (!owner) {
    return res.status(403).json({ error: 'User is not authorized' });
  }

  next();
};

const postById = async (req, res, next, id) => {
  try {
    // const post = await Post.findById(id).populate(postPopulateQuery).exec();

    // if (!post) {
    //   return res.status(400).json({ error: 'Post not found' });
    // }

    // req.post = post;

    const post = await Post.findById(id);
    const ownerPostId = get(post, 'owner');
    const allComments = await Comment.find({ postId: id });
    const ownerCommentIds = [...allComments.map((comment) => comment.owner), ownerPostId];
    const ownerIds = await User.find({ _id: { $in: ownerCommentIds } }).select('name');

    const { transformedPost, postComments } = transformPost(post, ownerIds, allComments);
    const transformedComments = transformComments(postComments, ownerIds);

    transformedPost.comments = transformedComments.filter((comment) => !get(comment, 'commentId'));

    if (!transformedPost) {
      return res.status(400).json({ error: 'Post not found' });
    }

    req.post = transformedPost;
    next();
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
  }
};

export default {
  createPost,
  getPosts,
  getPost,
  updatePost,
  postById,
  isOwner,
  likePost,
  deletePost,
  genPost,
};
