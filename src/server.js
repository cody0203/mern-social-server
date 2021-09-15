import mongoose from 'mongoose';

import config from '../config/config';
import app from './express';

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

app.listen(config.port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log('Server started on port %s.', config.port);
});
