const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8080,
  jwtSecret: process.env.JWT_SECRET || '4oi3tujiorwejfgoiwjfdpij123i-03urijewf',
  mongoUri:
    'mongodb+srv://cody:GFdPjfRLEEjuiVUQ@cluster0-uuofi.mongodb.net/mern-social' ||
    process.env.MONGO_URI ||
    process.env.MONGO_HOST ||
    'mongodb://' + (process.env.IP || 'localhost') + ':' + (process.env.MONGO_PORT || '27017') + '/mernproject',
};

export default config;
