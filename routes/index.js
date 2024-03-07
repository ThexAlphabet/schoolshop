// routes.js

const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./scratch');
const axios = require('axios');

const router = require('express').Router();
const { requiresAuth } = require('express-openid-connect');

router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Home | SchoolShop',
    userProfile: JSON.stringify(req.oidc.user, null, 2),
    isAuthenticated: req.oidc.isAuthenticated(),
    cartItems: req.session.cartItems || [],
  });
});

router.post('/auth/get', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const email = req.oidc.user.email;
    const nickname = req.oidc.user.nickname;
    const sid = req.oidc.user.sub;

    console.log('Received email:', email);
    console.log('Received nickname:', nickname);
    console.log('Received SID:', sid);

    await createOrUpdateUser(sid, email, nickname);

    const discordWebhookURL = process.env.DISCORD_WEBHOOK_URL; // Replace with your environment variable
    const message = `New user authenticated!\nEmail: ${email}\nNickname: ${nickname}\nSID: ${sid}`;
    await sendToDiscordWebhook(discordWebhookURL, message);

    res.status(200).json({ message: 'Data received and user saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

router.get('/add', (req, res) => {
  res.render('add', { cartItems: req.session.cartItems || [] });
});


router.get('/error', function (req, res, next) {
  res.render('error', {
    title: 'Error | SchoolShop',
    userProfile: JSON.stringify(req.oidc.user, null, 2),
    isAuthenticated: req.oidc.isAuthenticated(),
  });
});

router.get('/items', requiresAuth(), (req, res) => {
  const items = [
    { name: 'Arizona Ice Tea', price: 2, image: 'https://www.dollartree.com/ccstore/v1/images/?source=/file/v2989681447849503788/products/284226.jpg' },
    { name: 'hand gripper', price: 7, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/933c1c62ffbe97aea79e381f8aff701e.jpg?imageView2/2/w/800/q/70/format/webp' },
    { name: 'Sour Patch', price: 2, image: 'https://i5.walmartimages.com/seo/SOUR-PATCH-KIDS-Original-Soft-Chewy-Candy-Valentine-Candy-3-5-oz-Box_88eab23e-ad94-4604-8f52-1229e97a9436.5b52785d32431171e597ab744f504c9d.jpeg?odnHeight=640&odnWidth=640&odnBg=FFFFFF: ' },
    { name: 'Hair Styling Powder', price: 8 , image: 'https://img.kwcdn.com/product/fancy/4af8433c-7284-411a-8726-c3edac84141b.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'Push Game', price: 6, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/66e7b2461c9a5648670c7866109c40e7.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'Islam Bracelet', price: 5, image: 'https://img.kwcdn.com/product/open/2023-07-05/1688549279984-d8c754e730574f39921ebffef77bfe33-goods.jpeg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'Cross Bracelet', price: 5,image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/bb2e51ea7e894c5ff701ae738eb668a4.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'Pink Unbreakable Pencil', price: 4, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/0f8c5104fefed0060ba0fd9da49902b8.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'Blue Unbreakable Pencil', price: 4, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/03804453f960a3257a137bf8f46b89fd.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'Black and White Beanie', price: 5, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/6b7affb1104d029202660dfc659f6e37.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'Black and Red Beanie', price: 5, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/f39c8dc85167a84dac3d9b8e985663e6.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'Rings', price: 1,image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/d663dd745cc1fe15a7c211771d8bf19b.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'Rubber Band Gun', price: 5, image: 'https://img.kwcdn.com/product/open/2023-03-22/1679482441399-deb172f9491d41fdbccd1e9c70e6820f-goods.jpeg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'Monkey', price: 10, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/5d372bce49a73b3963c1027e543cb263.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'Car Stickers 10 for 2$', price: 2, image: 'https://img.kwcdn.com/product/open/2023-11-13/1699861590301-19b32e97d85d4dba91372946bbfa4051-goods.jpeg?imageView2/2/w/800/q/70/format/webp: ' },
  // Add more items as needed
  ]
  res.render('items', {
    userProfile: JSON.stringify(req.oidc.user, null, 2),
    title: 'Cart | SchoolShop',
    items: items,
  });
});

router.get('/order', requiresAuth(), function (req, res, next) {
  res.render('order', {
    userProfile: JSON.stringify(req.oidc.user, null, 2),
    title: 'Order | SchoolShop',
  });
});

router.get('/cart', requiresAuth(), function (req, res, next) {
  res.render('cart', {
    userProfile: JSON.stringify(req.oidc.user, null, 2),
    title: 'Cart | SchoolShop',
    cartItems: req.session.cartItems || [],
  });
});



router.post('/addToCart', requiresAuth(), (req, res) => {
  try {
    const auth0SessionId = req.oidc.user.sub;

    const item = {
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
    };

    let cartItems = JSON.parse(localStorage.getItem(`cartItems_${auth0SessionId}`)) || [];

    const existingItemIndex = cartItems.findIndex(i => i.name === item.name);

    if (existingItemIndex !== -1) {
      cartItems[existingItemIndex].quantity += 1;
    } else {
      item.quantity = 1;
      cartItems.push(item);
    }

    localStorage.setItem(`cartItems_${auth0SessionId}`, JSON.stringify(cartItems));

    res.redirect('/');
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/checkout', async (req, res) => {
  try {
    const auth0SessionId = req.oidc.user.sub;
    const userEmail = req.oidc.user.email;
    const cartItems = getCartItemsFromLocalStorage(auth0SessionId);

    await sendToDiscordWebhook(cartItems, auth0SessionId, userEmail);

    clearCartItemsFromLocalStorage(auth0SessionId);

    res.status(200).json({ message: 'Checkout successful!' });
  } catch (error) {
    console.error('Error during checkout:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function sendToDiscordWebhook(cartItems, auth0SessionId, userEmail) {
  try {
    // Check if cartItems is an array and not empty
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      const totalPrice = cartItems.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0);

      const webhookData = {
        content: `New Checkout!\nAuth0 Session ID: ${auth0SessionId}\nUser Email: ${userEmail}\nTotal Price: $${totalPrice.toFixed(2)}`,
        embeds: [
          {
            title: 'Cart Items',
            fields: cartItems.map((item, index) => ({
              name: `Item ${index + 1}`,
              value: `Name: ${item.name}\nPrice: $${item.price}\nQuantity: ${item.quantity}\n`,
            })),
          },
        ],
      };

      // Make HTTP POST request to Discord webhook
      await axios.post(process.env.DISCORD_WEBHOOK_URL, webhookData);
    } else {
      console.error('Error sending to Discord webhook: Invalid or empty cartItems array.');
      // Optionally log or handle the case when cartItems is empty
    }
  } catch (error) {
    console.error('Error sending to Discord webhook:', error.message);
  }
}

function getCartItemsFromLocalStorage(auth0SessionId) {
  return JSON.parse(localStorage.getItem(`cartItems_${auth0SessionId}`)) || [];
}

function clearCartItemsFromLocalStorage(auth0SessionId) {
  localStorage.removeItem(`cartItems_${auth0SessionId}`);
}

module.exports = router;
