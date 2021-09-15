import jwt from 'jsonwebtoken';
import get from 'lodash/get';
import expressJwt from 'express-jwt';

import User from '../models/user.model';
import config from '../../config/config';

const signIn = async (req, res, next) => {
  try {
    const { email, password } = get(req, 'body');
    const user = await User.findOne({ email });

    const id = get(user, '_id');
    const userName = get(user, 'name');
    const userEmail = get(user, 'email');

    if (!user) {
      return res.status(401).json({ message: 'User not found!' });
    }

    if (!user.authenticate(password)) {
      return res.status(401).json({ message: "Email and password don't match" });
    }

    const token = jwt.sign({ _id: id }, config.jwtSecret, {
      expiresIn: '1000d',
    });

    return res.json({
      token,
      user: {
        _id: id,
        name: userName,
        email: userEmail,
      },
    });
  } catch (err) {
    return res.status(401).json({ message: 'Could not sign in' });
  }
};

const userInfo = async (req, res, next) => {
  const auth = get(req, 'auth');
  const authId = get(auth, '_id');

  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await User.findById(authId).select('name email updated created followers following');

  if (!user) {
    return res.status(401).json({ message: 'User not found!' });
  }

  return res.json({
    user,
  });
};

const signOut = (req, res, next) => {
  res.clearCookie('t');
  res.status(200).json({ message: 'Signed out' });
};

const requireSignIn = expressJwt({
  secret: config.jwtSecret,
  userProperty: 'auth',
});

const hasAuthorization = (req, res, next) => {
  const profile = get(req, 'profile');
  const profileId = get(profile, '_id');
  const auth = get(req, 'auth');
  const authId = get(auth, '_id');

  const authorized = profile && auth && profileId.toString() === authId.toString();

  if (!authorized) {
    return res.status(403).json({ error: 'User is not authorized' });
  }

  next();
};

export default {
  signIn,
  signOut,
  requireSignIn,
  hasAuthorization,
  userInfo,
};
