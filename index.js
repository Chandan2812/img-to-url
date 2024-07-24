const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

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
  limits: { fileSize: 9000000 }, // Limit file size to 9MB
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

      // Call the background removal API with the image URL
      removeBackground(downloadUrl, (apiRes) => {
        if (apiRes) {
          // Delete the uploaded image file
          fs.unlink(imagePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error(`Error deleting file: ${unlinkErr.message}`);
              res.status(500).send('Failed to delete the original image!');
            } else {
              res.json({ downloadUrl, backgroundRemovedImageUrl: apiRes });
            }
          });
        } else {
          res.status(500).send('Background removal failed!');
        }
      });
    }
  });
});

// Function to call the background removal API
const removeBackground = async (imageUrl, callback) => {
  const form = new FormData();
  form.append('image_url', imageUrl);

  const options = {
    method: 'POST',
    url: 'https://background-removal.p.rapidapi.com/remove',
    headers: {
      'x-rapidapi-key': 'b3402da2eemsh9f38aabddad6fabp1be739jsn49f1254bdd37',
      'x-rapidapi-host': 'background-removal.p.rapidapi.com',
      ...form.getHeaders()
    },
    data: form
  };

  try {
    const response = await axios(options);
    console.log(response)
    const backgroundRemovedImageUrl = response.data.url; // Adjust this based on API response format
    callback(backgroundRemovedImageUrl);
  } catch (error) {
    console.error(`Error removing background: ${error.message}`);
    callback(null);
  }
};

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
