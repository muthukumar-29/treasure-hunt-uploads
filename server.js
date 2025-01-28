const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const sharp = require("sharp");

const app = express();
app.use(cors()); // Allow requests from the React frontend
app.use(express.json());

// Ensure the 'uploads/qrcode' folder exists
const qrCodeDirectory = path.join(__dirname, "uploads/qrcode");
if (!fs.existsSync(qrCodeDirectory)) {
  fs.mkdirSync(qrCodeDirectory, { recursive: true });
}

// Set up Multer storage for regular file uploads
const storage = multer.diskStorage({
  destination: "./uploads", // Default 'uploads' folder
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name with timestamp
  },
});

const upload = multer({ storage });

// Route to handle general file uploads (existing functionality)
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ filePath }); // Return the file path
});

// Set up Multer storage for QR code image uploads (new functionality)
const qrCodeUpload = multer.diskStorage({
  destination: "./uploads/qrcode", // Store QR code images in 'uploads/qrcode' folder
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name with timestamp
  },
});

const qrUpload = multer({ storage: qrCodeUpload });

// Route to handle QR code uploads
app.post("/upload-qrcode", qrUpload.single("file"), async(req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No QR code uploaded" });
  }

  const svgPath = req.file.path; // Path to the uploaded SVG
  const outputFilename = `${Date.now()}.png`; // Output file name
  const outputPath = path.join(qrCodeDirectory, outputFilename); // Full path to save PNG

  try {
    // Convert SVG to PNG using sharp
    await sharp(svgPath)
      .toFormat("png")
      .toFile(outputPath);

    // Remove the original SVG file after conversion
    fs.unlinkSync(svgPath);

    res.json({ filePath: `/uploads/qrcode/${outputFilename}` });
  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
    res.status(500).json({ error: "Failed to convert and store QR code" });
  }
});

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start the server
const PORT = 3003; // Use a different port to avoid conflict with React
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
