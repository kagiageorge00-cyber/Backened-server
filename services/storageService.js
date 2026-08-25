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

module.exports = {
  uploadFile,
};
