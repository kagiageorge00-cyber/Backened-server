let ioInstance = null;

function setSocketServer(io) {
  ioInstance = io;
}

function emitToUser(userId, event, payload) {
  if (!ioInstance) return false;
  try {
    ioInstance.to(userId).emit(event, payload);
    return true;
  } catch (err) {
    console.warn('emitToUser failed', err.message || err);
    return false;
  }
}

module.exports = { setSocketServer, emitToUser };
