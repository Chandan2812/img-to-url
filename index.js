const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize upload variable
const upload = multer({
  storage: storage,
  limits: { fileSize: 9000000 }, // Limit file size to 1MB
}).single('image');

// Static folder to serve the frontend
app.use(express.static('./public'));

// Upload endpoint
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        res.status(500).send('Something went wrong!');
      } else {
        const imagePath = path.join(__dirname, 'uploads', req.file.filename);
        const downloadUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        // Optionally, serve the image file directly from the server
        app.use('/uploads', express.static('uploads'));
  
        res.json({ downloadUrl });
        
      }
    });
  });
  

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
