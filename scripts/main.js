// public/scripts/main.js

document.addEventListener('DOMContentLoaded', function () {
    // Retrieve cart items from local storage
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
  
    // Display cart items in the cart page
    const cartContainer = document.getElementById('cart-container');
    if (cartContainer) {
      cartItems.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.innerHTML = `<p>${item.name} - $${item.price}</p>`;
        cartContainer.appendChild(cartItemElement);
      });
    }
  
    // Add event listener to the "Add to Cart" buttons in the items page
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
      button.addEventListener('click', function () {
        const itemName = this.getAttribute('data-name');
        const itemPrice = parseFloat(this.getAttribute('data-price'));
        const itemImage = this.getAttribute('data-image');
  
        // Add the item to the local storage
        cartItems.push({ name: itemName, price: itemPrice, image: itemImage });
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
      });
    });
  });
  