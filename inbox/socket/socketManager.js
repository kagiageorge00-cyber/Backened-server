const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { verifyEmployerToken } = require('../../services/jwtService');
const { verifyToken } = require('../../auth/services/authService');

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
      const token = socket.handshake.auth?.token;
      if (typeof token === 'string' && token.length > 0) {
        let authenticated = false;
        try {
          const decoded = verifyEmployerToken(token);
          if (decoded.employerId) {
            socket.join(String(decoded.employerId));
            authenticated = true;
          }
        } catch (error) {
          try {
            const staff = jwt.verify(token, process.env.JWT_SECRET || 'bliss-staff-secret');
            if (staff.email) socket.join(String(staff.email).trim().toLowerCase());
            socket.data.staff = staff;
            authenticated = true;
          } catch (staffError) {
            try {
              const candidate = jwt.verify(token, process.env.CANDIDATE_JWT_SECRET || 'candidate_secret_key');
              if (candidate.id) socket.join(`candidate:${candidate.id}`);
              socket.data.candidate = candidate;
              authenticated = true;
            } catch (candidateError) {
              try {
                const customer = verifyToken(token);
                if (customer.sub) socket.join(`candidate:${customer.sub}`);
                if (customer.blissId) socket.join(`candidate:${customer.blissId}`);
                socket.data.customer = customer;
                authenticated = true;
              } catch (customerError) {
                console.warn('Socket authentication failed:', customerError.message);
              }
            }
          }
        }
        socket.data.authenticated = authenticated;
      }

      socket.on('joinConversation', (conversationId) => {
        if (socket.data.authenticated && conversationId) socket.join(conversationId);
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
