const dotenv = require('dotenv');
const router = require('./routes/index');

const express = require('express');
const http = require('http');
const logger = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { auth } = require('express-openid-connect');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const session = require('express-session');
const { sendToDiscordWebhook } = require('./utils'); // Replace with the correct path to your utils file

dotenv.config();

const app = express();

app.use(session({
  secret: 'your-secret-key', // Replace with a secret key for session encryption
  resave: false,
  saveUninitialized: true,
}));

const mongoose = require('mongoose'); // Added for MongoDB connection
const Schema = mongoose.Schema; // Added for schema definition
const router = require('./routes/index');
const { auth } = require('express-openid-connect');


require('dotenv').config();


const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const config = {
  authRequired: false,
  auth0Logout: true,
};

const port = process.env.PORT || 3000;


if (!config.baseURL && !process.env.BASE_URL && process.env.PORT && process.env.NODE_ENV !== 'production') {
  config.baseURL = `https://turbo-eureka-v6w7qxwvj5pcprqw-3000.app.github.dev/`;
}

app.use(auth(config));


app.use(function (req, res, next) {
// Middleware to make the `user` object available for all views
app.use(function(req, res, next) {
  res.locals.user = req.oidc.user;
  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected!'))
  .then(() => console.log(`------------------`))
  .catch(err => console.error(err));

const userSchema = new Schema({
  sid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  nickname: { type: String, required: true },
// Connect to MongoDB (replace with your connection URI)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected!'))
  .then(() =>  console.log(`------------------`))
  .catch(err => console.error(err));

// Define the User schema for MongoDB
const userSchema = new Schema({
  sid: { type: String, required: true, unique: true },
  bio: { type: String, default: '' },
});

const User = mongoose.model('User', userSchema);

async function createOrUpdateUser(sid, email, nickname) {
  try {
    const existingUser = await User.findOne({ sid });
    if (existingUser) {
// Function to create user if not already present (handles duplicates)
async function createOrUpdateUser(sid) {
  try {
    const existingUser = await User.findOne({ sid });
    if (existingUser) {
      // Update existing user's bio if necessary (optional)
      // You can add logic to check if the bio has changed and update it accordingly
      console.log(`User with SID ${sid} already exists`);
      return;
    }

    const newUser = new User({ sid, email, nickname });
    const newUser = new User({ sid });
    await newUser.save();
    console.log(`User with SID ${sid} created successfully`);
  } catch (err) {
    console.error(err);
  }
}

// Mount the router at the root path
app.use('/', router);

http.createServer(app)
  .listen(port, () => {
    console.log(`Server online on port ${port}!`);
  });

// Route to handle POST request to /auth/get
app.post('/auth/get', (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Access request data (replace with your specific logic)
    const email = req.body.email; // Access email from request body

    // Perform necessary actions with the received data
    console.log('Received email:', email);

    // Securely handle any password data (avoid storing in plain text)

    // Create or update user in MongoDB
    createOrUpdateUser(req.oidc.user.sub); // Use sub claim (user ID) for SID

    // Send a response
    res.status(200).json({ message: 'Data received and user saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

app.use('/', router);


app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handlers
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: process.env.NODE_ENV !== 'production' ? err : {},
  });
});

http.createServer(app)
  .listen(port, () => {
    console.clear();

    console.log(`Server online!`);
  });
