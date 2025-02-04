const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const adminRoute = require('./routes/adminRoute');
const vendorRoute = require('./routes/vendorRoute')
const userRoute = require('./routes/userRoute')
const cloudinary = require('./services/cloudinaryConfig');

const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: 'https://quick-fix-frontend.vercel.app/',
    methods: ['GET', 'POST','PUT','DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// app.use(cors({
//     origin: 'http://localhost:5173/',
//     methods: ['GET', 'POST','PUT','DELETE'],
//     credentials: true,
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/admin', adminRoute);
app.use('/vendor', vendorRoute)
app.use('/',userRoute)

const mongoURI = process.env.MONGO_URL;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

app.listen(3002, () => {
    console.log(`Server running on port 3002`);
});
