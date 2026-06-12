const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

const CLOUDINARY_URL = process.env.CLOUDINARY_URL;

if (CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
}

async function uploadFile(filePath, folder) {
  if (CLOUDINARY_URL) {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder || 'bliss/employers',
      resource_type: 'auto',
    });
    return result.secure_url;
  }

  const fileName = path.basename(filePath);
  const publicPath = path.join(process.cwd(), 'uploads', folder || 'fallback', fileName);
  await fs.promises.mkdir(path.dirname(publicPath), { recursive: true });
  await fs.promises.copyFile(filePath, publicPath);
  return `/uploads/${folder || 'fallback'}/${fileName}`;
}

module.exports = {
  uploadFile,
};
