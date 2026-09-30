const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype.split('/')[1] || '');

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

/**
 * Upload product images (up to 5).
 * Uses Cloudinary when configured; otherwise keeps local /uploads files.
 */
const uploadProductImages = upload.array('images', 5);

const processUploadedImages = async (files = []) => {
  if (!files.length) return [];

  if (!isCloudinaryConfigured()) {
    return files.map((file) => `/uploads/${file.filename}`);
  }

  const urls = [];
  for (const file of files) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'south-sudan-marketplace/products',
    });
    urls.push(result.secure_url);
    fs.unlink(file.path, () => {});
  }
  return urls;
};

module.exports = {
  uploadProductImages,
  processUploadedImages,
  isCloudinaryConfigured,
  uploadsDir,
};
