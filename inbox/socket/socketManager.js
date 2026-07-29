const { Server } = require('socket.io');

class SocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    this.attach();
  }

  attach() {
    this.io.on('connection', (socket) => {
      socket.on('joinConversation', (conversationId) => {
        if (conversationId) socket.join(conversationId);
      });

      socket.on('typing', ({ conversationId, userId, typing }) => {
        socket.to(conversationId).emit('typing', { conversationId, userId, typing });
      });

      socket.on('messageSent', ({ conversationId, message }) => {
        socket.to(conversationId).emit('messageReceived', { conversationId, message });
      });

      socket.on('messageRead', ({ conversationId, messageId, readerId }) => {
        socket.to(conversationId).emit('messageRead', { conversationId, messageId, readerId });
      });
    });
  }

  emitConversationUpdate(conversationId, message) {
    this.io.to(conversationId).emit('conversationUpdated', { conversationId, message });
  }
}

module.exports = SocketManager;
