import mongoose from 'mongoose';
import get from 'lodash/get';

import config from '../config/config';
import app from './express';
import io from './socket';

import User from './models/user.model';

mongoose.set('useFindAndModify', false);

mongoose.Promise = global.Promise;
mongoose.connect(config.mongoUri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  userUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log(`connected to database: ${config.mongoUri}`);
});

mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${config.mongoUri}`);
});

const server = app.listen(config.port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log('Server started on port %s.', config.port);
});

const socketIo = io.init(server);

socketIo.on('connection', async (socket) => {
  console.log('Client connected');
  socket.on('join-room', (data) => {
    const userId = get(data, 'userId');

    socket.join(userId);
  });
});
