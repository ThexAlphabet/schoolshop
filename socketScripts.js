// Include this script in your HTML after including Socket.IO
const socket = io();

// Function to update the server with the current cart state
function updateServerCart(cartItems) {
  socket.emit('updateCart', { cartItems });
}

// Listen for cart updates from the server
socket.on('cartUpdated', (data) => {
  // Update your cart UI based on the received data
  // (You may need to modify this part based on your cart structure)
  console.log('Received cart update:', data);
  renderCartItems(data.cartItems);
  updateButtonVisibility();
});

// Example function to add an item to the cart
function addToCart(name, price, image) {
  const item = {
    name: name,
    price: price,
    image: image
  };

  // Get existing cart items from local storage
  let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

  // Check if the item is already in the cart
  const existingItemIndex = cartItems.findIndex(i => i.name === item.name);

  if (existingItemIndex !== -1) {
    // If the item is already in the cart, increase the quantity
    cartItems[existingItemIndex].quantity += 1;
  } else {
    // If the item is not in the cart, add it with a quantity of 1
    item.quantity = 1;
    cartItems.push(item);
  }

  // Update local storage with the updated cart
  localStorage.setItem('cartItems', JSON.stringify(cartItems));

  // Alert the user about the successful addition
  alert('Item successfully added to the cart!');
  renderCartItems(); // Update cart items on the page

  // Update the server with the new cart state
  updateServerCart(cartItems);
}

// Example function to render cart items on the page
function renderCartItems() {
  // Your rendering logic here
  console.log('Rendering cart items...');
}

// Example function to update button visibility based on cart items
function updateButtonVisibility() {
  // Your button visibility update logic here
  console.log('Updating button visibility...');
}
