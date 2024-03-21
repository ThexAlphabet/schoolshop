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
const { sendToDiscordWebhook } = require('./utils');
const { Client, Intents } = require('discord.js');
const Discord = require('discord.js')
const nodemailer = require('nodemailer');
const axios = require('axios'); // Import axios module
import ('./checkout.js')
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(session({
  secret: 'smsmsmdq91930193039mxjsiwju29',
  resave: false,
  saveUninitialized: true,
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const config = {
  authRequired: false,
  auth0Logout: true,
};

const discordWebhookUrl = 'https://discord.com/api/webhooks/1218586890819600384/IxOEsuiv77Qg78i7wu23y70QB8FwklkCY6kSNXcF5HHwVxtD_SQE57iiwlV_8C6SsIHk';

if (!config.baseURL && !process.env.BASE_URL && process.env.PORT && process.env.NODE_ENV !== 'production') {
  config.baseURL = `https://psychic-fishstick-97675rx4xjjjhx7p5-3000.app.github.dev/`;
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
  cart: { type: Array, default: [] },
});

const User = mongoose.model('User', userSchema);

app.use(async (req, res, next) => {
  if (req.oidc.isAuthenticated()) {
    const auth0SessionId = req.oidc.user.sub;
    const userEmail = req.oidc.user.email;
    const userNickname = req.oidc.user.nickname;

    await createOrUpdateUser(auth0SessionId, userEmail, userNickname);
  }

  next();
});

app.use('/', router);

app.post('/addToCart', async (req, res) => {
  try {
    const auth0SessionId = req.oidc.user.sub;

    const item = {
      id: req.body.id,
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
    };

    const user = await User.findOne({ sid: auth0SessionId });

    if (!user) {
      console.error('User not found in MongoDB');
      return res.status(404).json({ error: 'User not found' });
    }

    const existingItemIndex = user.cart.findIndex(i => i.id === item.id);

    if (existingItemIndex !== -1) {
      user.cart[existingItemIndex].quantity += 1;
    } else {
      item.quantity = 1;
      user.cart.push(item);
    }

    await user.save();

    console.log('Item added to cart:', item);

    res.status(200).json({ message: 'Item successfully added to the cart!' });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add a new route handler to handle removing an item
app.get('/removeFromCart', async (req, res) => {
  try {
    const auth0SessionId = req.oidc.user.sub;
    const itemId = req.query.itemId;

    const user = await User.findOne({ sid: auth0SessionId });

    if (!user) {
      console.error('User not found in MongoDB');
      return res.status(404).json({ error: 'User not found' });
    }

    const itemIndex = user.cart.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      console.error('Item not found in cart');
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    user.cart.splice(itemIndex, 1);

    await user.save();

    console.log('Item removed from cart with ID:', itemId);
    res.redirect('/cart')

  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('updateCart', (data) => {
    io.emit('cartUpdated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

http.createServer(app)
  .listen(3000, () => {
    console.log(`Server online!`);
  });

async function createOrUpdateUser(sid, email, nickname) {
  try {
    const existingUser = await User.findOne({ sid });
    if (existingUser) {
      console.log(`User with SID ${sid} already exists`);
      return existingUser;
    }

    const newUser = new User({ sid, email, nickname });
    await newUser.save();
    console.log(`User with SID ${sid} created successfully`);
    return newUser;
  } catch (err) {
    console.error(err);
    throw err;
  }
}


// Define the route handler for the POST request to /send-email
app.post('/send-email', async (req, res) => {
  try {
    const { name, items } = req.body; // Retrieve name and items from request body

    // Create a transporter object for sending emails
    const transporter = nodemailer.createTransport({
      // Configure the transporter (replace with your email service provider)
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com', // Replace with your email address
        pass: 'your-email-password', // Replace with your email password
      },
    });

    // Construct the email message
    const mailOptions = {
      from: 'your-email@gmail.com', // Sender address (replace with your email address)
      to: 'recipient@example.com', // Receiver address (replace with recipient's email address)
      subject: 'New Order Received',
      text: `Name: ${name}\n\nOrder Details:\n${JSON.stringify(items, null, 2)}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    console.log('Email sent successfully');
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Handle the checkout form submission
// Handle the checkout request



// Function to send order details to Discord webhook
async function sendOrderToDiscordWebhook({ name, items }) {
  try {
    // Construct the message payload for the Discord webhook
    const payload = {
      username: 'Order Bot',
      avatar_url: 'YOUR_AVATAR_URL_HERE', // Replace with your avatar URL
      content: `New order received from ${name}!\n\nOrder Details:\n`,
      embeds: [{
        title: 'Order Details',
        color: 0x00ff00,
        fields: items.map(item => ({
          name: item.name,
          value: `Price: $${item.price.toFixed(2)}\nQuantity: ${item.quantity}`,
          inline: true,
        })),
      }],
    };

    // Send the payload to the Discord webhook URL
    await axios.post('YOUR_DISCORD_WEBHOOK_URL_HERE', payload); // Replace with your Discord webhook URL

    console.log('Order details sent to Discord webhook successfully');
  } catch (error) {
    console.error('Error sending order details to Discord webhook:', error.message);
    throw error;
  }
}



// Define the route handler for the POST request to /checkout


// Define the route handler for the POST request to /checkout
// Define the route handler for the POST request to /checkout

async function saveOrderToDatabase({ auth0SessionId, userEmail, userName, cartItems }) {
  try {
    // Find or create the user document based on the auth0SessionId
    let user = await User.findOne({ sid: auth0SessionId });
    if (!user) {
      // If the user doesn't exist, create a new user document
      user = new User({ sid: auth0SessionId, email: userEmail, nickname: userName, orders: [] });
      await user.save(); // Save the new user document to the database
    }

    // Create a new order object
    const order = {
      name: userName,
      email: userEmail,
      items: cartItems,
    };

    // Push the new order to the user's orders array
    user.orders.push(order);

    // Save the user document
    await user.save();

    console.log('Order saved to database successfully');
  } catch (error) {
    console.error('Error saving order to database:', error.message);
    throw error;
  }
}




// Handle requests to view orders
app.get('/orders', async (req, res) => {
  try {
    // Fetch orders for the authenticated user from the database
    const auth0SessionId = req.oidc.user.sub;
    const user = await User.findOne({ sid: auth0SessionId });

    if (!user) {
      console.error('User not found in MongoDB');
      return res.status(404).json({ error: 'User not found' });
    }

    // Render the orders page and pass the orders data to the template
    res.render('orders', { orders: user.orders });
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/cart', async function (req, res, next) {
  try {
    const auth0SessionId = req.oidc.user.sub;

    const user = await User.findOne({ sid: auth0SessionId });

    if (!user) {
      console.error('User not found in MongoDB');
      return res.status(404).json({ error: 'User not found' });
    }

    const cartItems = user.cart || [];

    const itemsWithId = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity
    }));

    const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    res.status(200).json({ items: itemsWithId, totalPrice });
  } catch (error) {
    console.error('Error fetching cart items from the database:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




function formatOrderForDiscord(user, cartItems) {
  // Assuming you have a specific format for your order message
  // You can customize this function based on your requirements
  let message = `New order from ${user.name} (${user.email}): \n`;
  cartItems.forEach(item => {
    message += `- ${item.name}: ${item.quantity} \n`;
  });
  return message;
}




app.get('/cart', async function (req, res, next) {
  try {
    const auth0SessionId = req.oidc.user.sub;

    const user = await User.findOne({ sid: auth0SessionId });

    if (!user) {
      console.error('User not found in MongoDB');
      return res.status(404).json({ error: 'User not found' });
    }

    const cartItems = user.cart || [];

    res.render('cart', { cartItems });
  } catch (error) {
    console.error('Error fetching cart items from the database:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Assume you have an Express route handler
app.get('/checkout', (req, res) => {
  // Render an HTML form with input fields for name and class
  res.render('checkout', { errorMessage: null });
});

// Assume you have another route to handle the form submission

// Assume you have the sendOrderToDiscordWebhook function defined

app.post('/submit-order', async (req, res) => {
  try {
    const auth0SessionId = req.oidc.user.sub;
    const auth0Email = req.oidc.user.email;
    const auth0Nickname = req.oidc.user.nickname;



    const user = await User.findOne({ sid: auth0SessionId });

    if (!user) {
      console.error('User not found in MongoDB');
      return res.status(404).json({ error: 'User not found' });
    }

    const cartItems = user.cart || [];

    // Check if there are cart items
    if (cartItems.length === 0) {
      console.error('No cart items found for the user');
      return res.status(400).json({ error: 'No cart items found' });
    }

    const { name, userClass } = req.body;

    const orderMessage = {
      username: 'Order Bot',
      content: `@everyone New order received from **${name}** in class **${userClass}** ||with ID ${auth0SessionId}||. **Email: ${auth0Email} and Nickname: ${auth0Nickname}**. \n\nOrder Details:\n`,
      embeds: [{
        title: 'Order Details',
        color: 0x00ff00,
        fields: cartItems.map(item => ({
          name: item.name, 
          value: `Price: $${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}\nQuantity: ${item.quantity}`,
          inline: true,
        })),
      }],
    };

    // Replace 'YOUR_DISCORD_WEBHOOK_URL_HERE' with your actual Discord webhook URL
    await axios.post('https://discord.com/api/webhooks/1218586890819600384/IxOEsuiv77Qg78i7wu23y70QB8FwklkCY6kSNXcF5HHwVxtD_SQE57iiwlV_8C6SsIHk', orderMessage);

    // Clear user's cart
    user.cart = [];
    await user.save();

    console.log('Order details sent to Discord webhook successfully');
    res.redirect('/success');
  } catch (error) {
    console.error('Error processing order:', error.message);
    res.redirect('/checkout')
  }
});