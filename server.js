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
  bio: { type: String, default: '' },
});

const User = mongoose.model('User', userSchema);

async function createOrUpdateUser(sid, email, nickname) {
  try {
    const existingUser = await User.findOne({ sid });
    if (existingUser) {
      console.log(`User with SID ${sid} already exists`);
      return;
    }

    const newUser = new User({ sid, email, nickname });
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
