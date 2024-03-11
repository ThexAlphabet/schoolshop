const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const router = require('./routes/index');
const logger = require('morgan');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { auth } = require('express-openid-connect');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const session = require('express-session');
const { sendToDiscordWebhook } = require('./utils'); // Replace with the correct path to your utils file

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(session({
  secret: 'smsmsmdq91930193039mxjsiwju29', // Replace with a secret key for session encryption
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
  config.baseURL = `https://effective-palm-tree-97675rx4xjrwh9576-3000.app.github.dev/`;
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
  cart: { type: Array, default: [] }, // Use Array type for cart
});

const User = mongoose.model('User', userSchema);


// Define the createOrUpdateUser function
async function createOrUpdateUser(sid, email, nickname) {
  try {
    const existingUser = await User.findOne({ sid });
    if (existingUser) {
      console.log(`User with SID ${sid} already exists`);
      return existingUser; // Return the existing user
    }

    const newUser = new User({ sid, email, nickname });
    await newUser.save();
    console.log(`User with SID ${sid} created successfully`);
    return newUser; // Return the newly created user
  } catch (err) {
    console.error(err);
    throw err; // Propagate the error
  }
}

// Middleware to run createOrUpdateUser on every request
app.use(async (req, res, next) => {
  // Check if the user is authenticated (you may adjust this based on your authentication logic)
  if (req.oidc.isAuthenticated()) {
    const auth0SessionId = req.oidc.user.sub;
    const userEmail = req.oidc.user.email;
    const userNickname = req.oidc.user.nickname;

    // Call the createOrUpdateUser function
    await createOrUpdateUser(auth0SessionId, userEmail, userNickname);
  }

  // Continue to the next middleware or route handler
  next();
});

// Mount the router at the root path
app.use('/', router);


// Add the /addToCart route
// Add the /addToCart route
app.post('/addToCart', async (req, res) => {
  try {
    const auth0SessionId = req.oidc.user.sub;

    console.log('Auth0 Session ID:', auth0SessionId);

    const item = {
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
    };

    const user = await User.findOne({ sid: auth0SessionId });

    // Check if the user exists
    if (!user) {
      console.error('User not found in MongoDB');
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the item is already in the cart
    const existingItemIndex = user.cart.findIndex(i => i.name === item.name);

    if (existingItemIndex !== -1) {
      // If the item is already in the cart, increase the quantity
      user.cart[existingItemIndex].quantity += 1;
    } else {
      // If the item is not in the cart, add it with a quantity of 1
      item.quantity = 1;
      user.cart.push(item);
    }

    // Save the updated user document
    await user.save();

    console.log('Item added to cart:', item);

    // Alert the user about the successful addition
    res.status(200).json({ message: 'Item successfully added to the cart!' });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/cart', async function (req, res, next) {
  try {
    const auth0SessionId = req.oidc.user.sub;

    // Fetch cart items from the database
    const user = await User.findOne({ sid: auth0SessionId });

    if (!user) {
      console.error('User not found in MongoDB');
      return res.status(404).json({ error: 'User not found' });
    }

    const cartItems = user.cart || [];

    // Send the cart items as a JSON object to the client-side
    res.status(200).json({ cartItems });
  } catch (error) {
    console.error('Error fetching cart items from the database:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for cart updates from clients
  socket.on('updateCart', (data) => {
    // Broadcast the updated cart to all connected clients
    io.emit('cartUpdated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

http.createServer(app)
  .listen(port, () => {
    console.log(`Server online on port ${port}!`);
  });
