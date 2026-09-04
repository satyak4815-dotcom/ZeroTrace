const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Allowed signal file extensions
const ALLOWED_EXTENSIONS = ['.iq', '.wav', '.sigmf-data'];

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

async function uploadToCloud(fileBuffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ resource_type: "raw" }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    }).end(fileBuffer);
  });
}

module.exports = { upload, uploadToCloud };