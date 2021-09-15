let io;

export default {
  init: (httpServer) => {
    io = require('socket.io')(httpServer, { pingTimeout: 7000, pingInterval: 3000 });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }

    return io;
  },
  people: {},
};
