const cloudinary = require('cloudinary').v2;

const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
const cloudinaryConfigured = Boolean(
  CLOUDINARY_URL || (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
);

if (CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function uploadFile(filePath, folder) {
  if (!cloudinaryConfigured) {
    throw new Error('Cloudinary is not configured');
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder: folder || 'bliss/employers',
    resource_type: 'auto',
  });
  if (!result.secure_url) throw new Error('Cloudinary did not return a preview URL');
  return result.secure_url;
}

async function uploadBuffer(buffer, { filename, folder = 'bliss/whatsapp-inbox' } = {}) {
  if (!cloudinaryConfigured) {
    throw new Error('Cloudinary is not configured');
  }
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('A non-empty file buffer is required');
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        ...(filename ? { filename_override: filename } : {}),
      },
      (error, uploaded) => {
        if (error) return reject(error);
        if (!uploaded?.secure_url) {
          return reject(new Error('Cloudinary did not return a preview URL'));
        }
        resolve(uploaded);
      },
    );
    stream.on('error', reject);
    stream.end(buffer);
  });

  return result.secure_url;
}

module.exports = {
  uploadFile,
  uploadBuffer,
};
