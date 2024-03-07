// routes.js

const router = require('express').Router();
const { requiresAuth } = require('express-openid-connect');
const fs = require('fs');
const path = require('path');



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

    const discordWebhookURL = 'YOUR_DISCORD_WEBHOOK_URL';
    const message = `New user authenticated!\nEmail: ${email}\nNickname: ${nickname}\nSID: ${sid}`;
    sendToDiscordWebhook(discordWebhookURL, message);

    res.status(200).json({ message: 'Data received and user saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

router.get('/add', (req, res) => {
  res.render('add', { cartItems: req.session.cartItems || [] });
});

router.post('/addToCart', requiresAuth(), (req, res) => {
  const item = {
    name: req.body.name,
    price: req.body.price,
    image: req.body.image,
  };

  // Add the item to the cart in the session
  req.session.cartItems = req.session.cartItems || [];
  req.session.cartItems.push(item);

  res.redirect('/');
});

router.post('/checkout', (req, res) => {
  const discordWebhookURL = 'YOUR_DISCORD_WEBHOOK_URL';
  const message = `New order placed! Items: ${req.session.cartItems.map(item => item.name).join(', ')}`;
  sendToDiscordWebhook(discordWebhookURL, message);

  req.session.cartItems = []; // Clear items in the session

  res.redirect('/order');
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
    { name: 'arizona ice tea', price: 2, image: 'https://www.dollartree.com/ccstore/v1/images/?source=/file/v2989681447849503788/products/284226.jpg' },
    { name: 'hand gripper', price: 7, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/933c1c62ffbe97aea79e381f8aff701e.jpg?imageView2/2/w/800/q/70/format/webp' },
    { name: 'sour patch', price: 2, image: 'https://i5.walmartimages.com/seo/SOUR-PATCH-KIDS-Original-Soft-Chewy-Candy-Valentine-Candy-3-5-oz-Box_88eab23e-ad94-4604-8f52-1229e97a9436.5b52785d32431171e597ab744f504c9d.jpeg?odnHeight=640&odnWidth=640&odnBg=FFFFFF: ' },
    { name: 'Hair Styling Powder', price: 8 , image: 'https://img.kwcdn.com/product/fancy/4af8433c-7284-411a-8726-c3edac84141b.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'push game', price: 6, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/66e7b2461c9a5648670c7866109c40e7.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'islam bracelet', price: 5, image: 'https://img.kwcdn.com/product/open/2023-07-05/1688549279984-d8c754e730574f39921ebffef77bfe33-goods.jpeg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'cross bracelet', price: 5,image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/bb2e51ea7e894c5ff701ae738eb668a4.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'pink unbreakable pencil', price: 4, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/0f8c5104fefed0060ba0fd9da49902b8.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'blue unbreakable pencil', price: 4, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/03804453f960a3257a137bf8f46b89fd.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'black and white beanie', price: 5, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/6b7affb1104d029202660dfc659f6e37.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    { name: 'black and red beanie', price: 5, image: 'https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/f39c8dc85167a84dac3d9b8e985663e6.jpg?imageView2/2/w/800/q/70/format/webp: ' },
    
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

module.exports = router;