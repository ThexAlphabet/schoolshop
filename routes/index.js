var router = require('express').Router();
const { requiresAuth } = require('express-openid-connect');

router.get('/', function (req, res, next) {
    res.render('index', {
      title: 'Home | SchoolShop',
      userProfile: JSON.stringify(req.oidc.user, null, 2),
      isAuthenticated: req.oidc.isAuthenticated()
    });
  });
  
  router.get('/items', requiresAuth(), function (req, res, next) {
    res.render('items', {
      userProfile: JSON.stringify(req.oidc.user, null, 2),
      title: 'Cart | SchoolShop',
    });
  });
  
  
  router.get('/order', requiresAuth(), function (req, res, next) {
    res.render('order', {
      userProfile: JSON.stringify(req.oidc.user, null, 2),
      title: 'Order | SchoolShop'
    });
  });
  


  module.exports = router;