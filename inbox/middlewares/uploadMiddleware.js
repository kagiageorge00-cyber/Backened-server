const multer = require('multer');
const { createAdaptiveStorage } = require('../../routes/upload');

const upload = multer({
  storage: createAdaptiveStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

module.exports = upload;
