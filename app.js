const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const adminRoute = require('./routes/adminRoute');
const vendorRoute = require('./routes/vendorRoute')
const cloudinary = require('./services/cloudinaryConfig');

const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', adminRoute);
app.use('/', vendorRoute)

const mongoURI = process.env.MONGO_URL;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

app.listen(3002, () => {
    console.log(`Server running on port 3002`);
});
