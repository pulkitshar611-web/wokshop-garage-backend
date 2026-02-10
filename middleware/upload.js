const fs = require('fs')
const path = require('path')
const multer = require('multer')

const uploadsDir = path.join(__dirname, '..', 'uploads', 'testing-records')
fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeOriginal}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

const testingRecordUpload = upload.fields([
  { name: 'photos', maxCount: 20 },
  { name: 'pdfReports', maxCount: 20 },
  { name: 'calibrationSheets', maxCount: 20 },
])

module.exports = {
  upload,
  testingRecordUpload,
}
