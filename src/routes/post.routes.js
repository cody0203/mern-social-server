import express from 'express';
import authControllers from '../controllers/auth.controllers';
import postControllers from '../controllers/post.controllers';
import userControllers from '../controllers/user.controllers';

const router = express.Router();

router.route('/api/gen-post').get(postControllers.genPost);

router.route('/api/posts').get(authControllers.requireSignIn, postControllers.getPosts);

router.route('/api/post/').post(authControllers.requireSignIn, postControllers.createPost);

router
  .route('/api/post/:postId')
  .put(authControllers.requireSignIn, postControllers.isOwner, postControllers.updatePost)
  .delete(authControllers.requireSignIn, postControllers.isOwner, postControllers.deletePost);

router.route('/api/post/like/:postId').put(authControllers.requireSignIn, postControllers.likePost);

router.route('/api/post/:userId').get(authControllers.requireSignIn, postControllers.getPost);

router.param('userId', userControllers.userById);

router.param('postId', postControllers.postById);

export default router;
