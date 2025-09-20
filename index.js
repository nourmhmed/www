// Global cart functionality using localStorage
const CART_KEY = 'syrines_crumble_cart';
let selectedBox = null;
let selectedStyle = 'chewy';

let selectedFlavors = {};

// Cookie data with different images for Chewy and Crumble styles
        const cookieData = {
            'chocolate-chip': {
                title: 'The Original Chocolate Chips',
                description: 'Classic chocolate chip cookie with premium Belgian chocolate',
                images: {
                    chewy: 'images/original_chewy_cookie.svg',
                    crumble: 'images/original_crumble_cookie.svg'
                },
                price: '80 LE',
                ingredients: 'Flour, Belgian chocolate chunks, butter, brown sugar, eggs, vanilla extract, baking soda, salt',
                specialty: 'Made with premium Belgian chocolate for a rich, authentic flavor',
                perfectFor: 'Chocolate lovers, classic cookie enthusiasts, and family gatherings'
            },
            'chocolate-crispy': {
                title: 'Chocolate Crispy Affair',
                description: 'Chocolate cookie with crispy rice and chocolate chunks',
                images: {
                    chewy: 'images/chocolate_crispy_affair_chewy.svg',
                    crumble: 'images/chocolate_crispy_affair_crumble.svg'
                },
                price: '90 LE',
                ingredients: 'Flour, cocoa powder, crispy rice cereal, chocolate chunks, butter, sugar, eggs, vanilla extract',
                specialty: 'Combination of rich chocolate and satisfying crispy texture',
                perfectFor: 'Those who enjoy texture contrast, kids, and as a snack with coffee'
            },
            'caramel': {
                title: 'The Caramel Bad Girl',
                description: 'Buttery cookie with swirls of caramel and sea salt',
                images: {
                    chewy: 'images/caramel_chewy_cookie.svg',
                    crumble: 'images/caramel_crumble_cookie.svg'
                },
                price: '85 LE',
                ingredients: 'Flour, butter, caramel swirls, sea salt, brown sugar, eggs, vanilla extract, baking soda',
                specialty: 'Sweet and salty combination with gooey caramel centers',
                perfectFor: 'Those with a sophisticated palate, dessert lovers, and special occasions'
            },
            'hazelnut': {
                title: 'The Hazelnut Mommy',
                description: 'Nutty cookie with roasted hazelnuts and chocolate chunks',
                images: {
                    chewy: 'images/hazelnuts_chewy_cookie.svg',
                    crumble: 'images/hazelnuts_crumble_cookie.svg'
                },
                price: '95 LE',
                ingredients: 'Flour, roasted hazelnuts, chocolate chunks, butter, sugar, eggs, vanilla extract',
                specialty: 'Premium roasted hazelnuts and quality chocolate create a comforting flavor',
                perfectFor: 'Nut lovers, comforting treats, and pairing with milk or hot beverages'
            },
            'lotus': {
                title: 'Lotus Obsession',
                description: 'Cookie with lotus biscuit spread and white chocolate',
                images: {
                    chewy: 'images/lotus_chewy_cookie.svg',
                    crumble: 'images/lotus_crumble_cookie.svg'
                },
                price: '85 LE',
                ingredients: 'Flour, lotus biscuit spread, white chocolate chunks, butter, sugar, eggs, cinnamon',
                specialty: 'Unique flavor combination of lotus spread and white chocolate',
                perfectFor: 'Lotus biscuit fans, those who enjoy unique flavor combinations, and as a dessert'
            }
        };

        // Global variables
        let currentCookie = null;
        let currentStyle = 'chewy';
        let quantity = 1;


        // Style selection functionality
        document.querySelectorAll('.style-option').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering card click
                const parent = this.parentElement;
                parent.querySelectorAll('.style-option').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
            });
        });


        // Add to cart functionality
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering card click
                const cookieCard = this.closest('.cookie-card');
                const cookieName = cookieCard.querySelector('h3').textContent;
                const selectedStyle = cookieCard.querySelector('.style-option.active').textContent;
                const price = cookieCard.querySelector('.cookie-price').textContent;
                
                // Visual feedback
                this.innerHTML = '<i class="fas fa-check"></i> Added to Cart';
                this.style.background = '#2e8b57';
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
                    this.style.background = '#8b5a2b';
                }, 1500);
                
                // In a real application, you would add to cart logic here
                console.log(`Added to cart: ${cookieName} (${selectedStyle}) - ${price}`);
            });
        });

        // Tab switching functionality
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
            });
        });

        

        // Popup functionality
        function openPopup(cookieType) {
            currentCookie = cookieType;
            currentStyle = 'chewy';
            quantity = 1;
            
            const cookie = cookieData[cookieType];
            document.getElementById('popupTitle').textContent = cookie.title;
            document.getElementById('popupDescription').textContent = cookie.description;
            document.getElementById('popupImage').style.backgroundImage = `url(${cookie.images.chewy})`;
            document.getElementById('popupPrice').textContent = cookie.price;
            document.getElementById('popupIngredients').textContent = cookie.ingredients;
            document.getElementById('popupSpecialty').textContent = cookie.specialty;
            document.getElementById('popupPerfectFor').textContent = cookie.perfectFor;
            document.getElementById('quantityValue').textContent = quantity;
            
            // Set active style button
            document.querySelectorAll('.popup-style-option').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector('.popup-style-option[data-style="chewy"]').classList.add('active');
            
            document.getElementById('popupOverlay').classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when popup is open
        }

        function closePopup() {
            document.getElementById('popupOverlay').classList.remove('active');
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        }

        // Close popup when clicking outside of it
        document.getElementById('popupOverlay').addEventListener('click', function(e) {
            if (e.target === this) {
                closePopup();
            }
        });



        // Change style function
        function changeStyle(style) {
            currentStyle = style;
            
            // Update style buttons
            document.querySelectorAll('.popup-style-option').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`.popup-style-option[data-style="${style}"]`).classList.add('active');
            
            // Update image based on style
            if (currentCookie && cookieData[currentCookie]) {
                document.getElementById('popupImage').style.backgroundImage = `url(${cookieData[currentCookie].images[style]})`;
            }
        }

        // Quantity functionality
        function increaseQuantity() {
            quantity++;
            document.getElementById('quantityValue').textContent = quantity;
        }
        
        function decreaseQuantity() {
            if (quantity > 1) {
                quantity--;
                document.getElementById('quantityValue').textContent = quantity;
            }
        }
        
        // Add single cookie from popup
function addToCartFromPopup() {
    const cookieName = document.getElementById('popupTitle').textContent;
    const price = parseInt(document.getElementById('popupPrice').textContent) || 0;
    const qty = quantity || 1; // quantity is managed globally with increase/decreaseQuantity()
    const style = currentStyle || 'chewy'; // default to chewy if not changed

    const name = `${cookieName} (${style.charAt(0).toUpperCase() + style.slice(1)})`;

    // Build cart object
    const cart = getCart();
    cart.push({
        id: Date.now(),
        name: name,
        price: price * qty,
        img: document.getElementById('popupImage').style.backgroundImage.replace(/url\(["']?([^"']*)["']?\)/, '$1'),
        quantity: qty,
        style: style
    });

    saveCart(cart);
    updateCartUI();
    showNotification(`${name} added to cart!`);

    // Visual feedback
    const addButton = document.querySelector('.popup-add-to-cart');
    addButton.innerHTML = '<i class="fas fa-check"></i> Added!';
    addButton.style.background = '#2e8b57';

    setTimeout(() => {
        addButton.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
        addButton.style.background = '#8b5a2b';
        closePopup();
    }, 1500);

    // Reset quantity
    quantity = 1;
    document.getElementById('quantityValue').textContent = quantity;
}



// Get cart from localStorage or initialize empty cart
function getCart() {
    const cartJSON = localStorage.getItem(CART_KEY);
    return cartJSON ? JSON.parse(cartJSON) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.clear();
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    console.log("cart",cart)
}

// Update cart UI
function updateCartUI() {
    const cart = getCart();
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    // Update cart count
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;

    // Update cart items if cart sidebar exists
    if (cartItems) {
        cartItems.innerHTML = '';

        if (cart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
            if (cartTotal) cartTotal.textContent = 'LE 0.00 EGP';
            return;
        }

        let total = 0;
        console.log("cart",cart)

        cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    // Build flavor details HTML
    let flavorHTML = "";
    if (item.flavors && Array.isArray(item.flavors)) {
        flavorHTML = `
            <div class="cart-item-flavors">
                ${item.flavors.map(f => `
                    <div class="cart-item-flavor">
                        <span class="flavor-details">
                           <span style="font-weight:bold; font-size:1.2em;"> - </span>  ${f.flavor.trim()} x${f.quantity} - ${f.type}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
        <div class="cart-item-image">
            <img src="${item.img}" alt="${item.name}">
        </div>
        <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">LE ${item.price}.00 EGP</div>
            
            ${flavorHTML} <!-- flavors go here -->
            
            <div class="cart-item-quantity">
                <button class="decrease-quantity" data-index="${index}">-</button>
                <input type="text" value="${item.quantity}" readonly>
                <button class="increase-quantity" data-index="${index}">+</button>
                <button class="remove-item" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    cartItems.appendChild(cartItem);
});


        // Update total
        if (cartTotal) cartTotal.textContent = `LE ${total}.00 EGP`;

        // Add event listeners to cart items
        document.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', function () {
                const index = parseInt(this.getAttribute('data-index'));
                const cart = getCart();
                cart[index].quantity++;
                saveCart(cart);
                updateCartUI();
            });
        });

        document.querySelectorAll('.decrease-quantity').forEach(button => {
            button.addEventListener('click', function () {
                const index = parseInt(this.getAttribute('data-index'));
                const cart = getCart();
                if (cart[index].quantity > 1) {
                    cart[index].quantity--;
                } else {
                    cart.splice(index, 1);
                }
                saveCart(cart);
                updateCartUI();
            });
        });

        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function () {
                const index = parseInt(this.getAttribute('data-index'));
                const cart = getCart();
                cart.splice(index, 1);
                saveCart(cart);
                updateCartUI();
            });
        });
    }
}

// Show notification when item is added to cart
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Initialize cart UI
updateCartUI();

// Cart sidebar toggle
const cartIcon = document.getElementById('cart-icon');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCart = document.getElementById('close-cart');
const cartOverlay = document.getElementById('cart-overlay');

if (cartIcon && cartSidebar && closeCart && cartOverlay) {
    cartIcon.addEventListener('click', function () {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    });

    closeCart.addEventListener('click', function () {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    });

    cartOverlay.addEventListener('click', function () {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    });
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const headerTabs = document.querySelector('.header-tabs');

if (mobileMenuBtn && headerTabs) {
    mobileMenuBtn.addEventListener('click', function () {
        headerTabs.classList.toggle('active');
    });
}

// Tab functionality
document.addEventListener('DOMContentLoaded', function () {
    const tabBtns = document.querySelectorAll('.header-tabs .tab-btn');
    const footerTabLinks = document.querySelectorAll('.footer-tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const cookies = document.querySelectorAll('.cookie-character');

    cookies.forEach(cookie => {
                cookie.addEventListener('mouseenter', () => {
                    const speech = cookie.querySelector('.cookie-speech');
                    speech.style.animation = 'none';
                    setTimeout(() => {
                        speech.style.animation = 'fadeInOut 5s';
                    }, 10);
                });
            });

     // Simple floating animation
            setInterval(() => {
                cookies.forEach(cookie => {
                    cookie.style.transform = `translateY(${Math.sin(Date.now() / 1000) * 10}px)`;
                });
            }, 100);

    function switchTab(tabId) {
        // Remove active class from all buttons and contents
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked button
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');

        // Show corresponding content
        document.getElementById(`${tabId}-tab`).classList.add('active');

        // Close mobile menu if open
        if (headerTabs.classList.contains('active')) {
            headerTabs.classList.remove('active');
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }

    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    footerTabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Box selection functionality
    const styleBtns = document.querySelectorAll('.style-btn');
    const boxOptions = document.querySelectorAll('.box-option');
    const popupStyleBtns = document.querySelectorAll('.popup-style-btn');

    // Update the style selection to store the selected style
    styleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');

            selectedStyle = this.getAttribute('data-style');

            // Update box prices
            boxOptions.forEach(box => {
                const price = box.getAttribute(`data-${selectedStyle}`);
                box.querySelector('.price-display').textContent = `${price} LE`;
            });
        });
    });
    
    // Update popup style selection
    popupStyleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('#popup-style-selection .popup-style-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');

            selectedStyle = this.getAttribute('data-style');

            // Update price in popup
            if (selectedBox) {
                const price = selectedBox.getAttribute(`data-${selectedStyle}`);
                document.getElementById('popup-box-price').textContent = `${price} LE`;

                // Refresh flavor grid based on newly selected style
                const size = selectedBox.getAttribute('data-size');
                const cookieCount = getCookieCount(size);
                showFlavorPopup(size, cookieCount, selectedBox);
            }
        });
    });

    // Get number of cookies based on box size
    function getCookieCount(size) {
        const counts = {
            'duo': 2,
            'trio': 3,
            'classic': 4,
            'craver': 6,
            'feast': 9
        };
        return counts[size] || 2;
    }

    // Show flavor selection popup
    function showFlavorPopup(size, cookieCount, boxElement) {
        const popupOverlay = document.getElementById('flavor-popup-overlay');
        const popup = document.getElementById('flavor-popup');
        const popupTitle = document.getElementById('popup-box-title');
        const popupBoxName = document.getElementById('popup-box-name');
        const popupBoxDesc = document.getElementById('popup-box-description');
        const popupBoxPrice = document.getElementById('popup-box-price');
        const flavorCount = document.getElementById('flavor-count');
        const maxCount = document.getElementById('max-count');
        const flavorGrid = document.getElementById('popup-flavor-grid');
        const selectedCount = document.querySelector('.selected-count');
        const finalPrice = document.getElementById('final-price');
        const selectedFlavorsSummary = document.getElementById('selected-flavors-summary');
        
        // Reset selected flavors
        selectedFlavors = {};
        
        // Get box details
        const sizeName = size.charAt(0).toUpperCase() + size.slice(1);
        const description = boxElement.querySelector('p').textContent;
        const price = boxElement.getAttribute(`data-${selectedStyle}`);
        
        // Update popup content
        popupTitle.textContent = `Customize Your ${sizeName} Box`;
        popupBoxName.textContent = `The ${sizeName}`;
        popupBoxDesc.textContent = description;
        popupBoxPrice.textContent = `${price} LE`;
        finalPrice.textContent = price;
        flavorCount.textContent = cookieCount;
        maxCount.textContent = cookieCount;
        selectedCount.textContent = '0';
        
        // Reset style selection in popup
        document.querySelectorAll('#popup-style-selection .popup-style-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.getAttribute('data-style') === selectedStyle) {
                btn.classList.add('selected');
            }
        });
        
        // Create flavor options
        const flavors = [
                { id: 'flavor-chocolate-chewy', name: 'The Original Chocolate Chips', type: 'chewy', price: 80 },
                { id: 'flavor-chocolate-crumble', name: 'The Original Chocolate Chips', type: 'crumble', price: 80 },

                { id: 'flavor-crispy-chewy', name: 'Chocolate Crispy Affair', type: 'chewy', price: 90 },
                { id: 'flavor-crispy-crumble', name: 'Chocolate Crispy Affair', type: 'crumble', price: 90 },

                { id: 'flavor-caramel-chewy', name: 'The Caramel Bad Girl', type: 'chewy', price: 85 },
                { id: 'flavor-caramel-crumble', name: 'The Caramel Bad Girl', type: 'crumble', price: 85 },

                { id: 'flavor-hazelnut-chewy', name: 'The Hazelnut Mommy', type: 'chewy', price: 95 },
                { id: 'flavor-hazelnut-crumble', name: 'The Hazelnut Mommy', type: 'crumble', price: 95 },

                { id: 'flavor-lotus-chewy', name: 'Lotus Obsession', type: 'chewy', price: 85 },
                { id: 'flavor-lotus-crumble', name: 'Lotus Obsession', type: 'crumble', price: 85 }
            ];

        // Create flavor options with quantity selectors
        flavorGrid.innerHTML = '';
        const filteredFlavors = flavors.filter(f => selectedStyle === 'mix' ? true : f.type === selectedStyle);
        
        filteredFlavors.forEach(flavor => {
            const uniqueId = `${flavor.id}-${flavor.type}`;
            selectedFlavors[uniqueId] = 0; // Initialize with 0 selected
            
            const flavorOption = document.createElement('div');
            flavorOption.className = 'flavor-option';
            flavorOption.setAttribute('data-id', uniqueId);
            flavorOption.innerHTML = `
                <div class="flavor-label">
                    <div class="flavor-name">${flavor.name}</div>
                    <div class="flavor-type">${flavor.type}</div>
                </div>
                <div class="flavor-quantity">
                    <button class="decrease" data-id="${uniqueId}">-</button>
                    <span id="qty-${uniqueId}">0</span>
                    <button class="increase" data-id="${uniqueId}">+</button>
                </div>
            `;
            flavorGrid.appendChild(flavorOption);
        });

        // Add counter logic
        flavorGrid.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const qtySpan = document.getElementById(`qty-${id}`);
                let qty = parseInt(qtySpan.textContent);
                const totalSelected = getTotalSelected();
                
                if (this.classList.contains('increase')) {
                    if (totalSelected < cookieCount) {
                        qty++;
                        selectedFlavors[id] = qty;
                        qtySpan.textContent = qty;
                        updateSelectionUI(cookieCount);
                    } else {
                        showNotification(`You can only select ${cookieCount} cookies for this box.`);
                    }
                } else if (this.classList.contains('decrease') && qty > 0) {
                    qty--;
                    selectedFlavors[id] = qty;
                    qtySpan.textContent = qty;
                    updateSelectionUI(cookieCount);
                }
            });
        });
        
        // Update selected flavors summary
        function updateSelectionUI(cookieCount) {
            const totalSelected = getTotalSelected();
            selectedCount.textContent = totalSelected;
            
            // Update selected flavors summary
            selectedFlavorsSummary.innerHTML = '<h5>Your Selection:</h5>';
            
            if (totalSelected === 0) {
                selectedFlavorsSummary.innerHTML += '<p class="no-selection">No flavors selected yet</p>';
            } else {
                for (const [id, qty] of Object.entries(selectedFlavors)) {
                    console.log("selectedFlavors", selectedFlavors)
                    if (qty > 0) {
                        const flavorDiv = document.createElement('div');
                        flavorDiv.className = 'selected-flavor-item';
                        
                        // Find the flavor name
                        const flavorName = flavors.find(f => `${f.id}-${f.type}` === id)?.name || 'Unknown Flavor';
                        const flavorType = flavors.find(f => `${f.id}-${f.type}` === id)?.type || 'Unknown Flavor';
                        console.log("flavors", flavors)
                        
                        flavorDiv.innerHTML = `
                            <span>${flavorName} - ${flavorType}</span>
                            <span>${qty} x</span>
                        `;
                        selectedFlavorsSummary.appendChild(flavorDiv);
                    }
                }
            }
            
            // Enable/disable add to cart button
            const addButton = document.getElementById('add-box-from-popup');
            if (totalSelected === cookieCount) {
                addButton.disabled = false;
                addButton.style.opacity = '1';
            } else {
                addButton.disabled = true;
                addButton.style.opacity = '0.7';
            }
        }
        
        function getTotalSelected() {
            return Object.values(selectedFlavors).reduce((sum, qty) => sum + qty, 0);
        }
        
        // Initialize UI
        updateSelectionUI(cookieCount);

        // Show popup
        popupOverlay.classList.add('active');
        popup.classList.add('active');
    }



    // Box selection
    boxOptions.forEach(box => {
        box.addEventListener('click', function () {
            selectedBox = this;
            const size = this.getAttribute('data-size');
            const cookieCount = getCookieCount(size);

            // Show flavor selection popup
            showFlavorPopup(size, cookieCount, this);
        });
    });

    // Close popup
    document.getElementById('close-popup').addEventListener('click', closeFlavorPopup);
document.getElementById('flavor-popup-overlay').addEventListener('click', closeFlavorPopup);
// document.getElementById('cancel-popup').addEventListener('click', closeFlavorPopup);

    function closeFlavorPopup() {
        document.getElementById('flavor-popup-overlay').classList.remove('active');
        document.getElementById('flavor-popup').classList.remove('active');
    }

    document.getElementById("start-checkout").addEventListener("click", function () {
    window.location.href = "checkout.html";
});

    // Add box from popup
    document.getElementById('add-box-from-popup').addEventListener('click', function () {
        if (!selectedBox) {
            showNotification('Please select a box first!');
            return;
        }

        const size = selectedBox.getAttribute('data-size');
        const cookieCount = getCookieCount(size);
        const price = parseInt(selectedBox.getAttribute(`data-${selectedStyle}`));

        // Collect flavors with quantities
        const selectedFlavors = [];
        document.querySelectorAll('#popup-flavor-grid .flavor-option').forEach(option => {
            console.log("option", option)
            const label = option.querySelector('.flavor-label').textContent;
            const qty = parseInt(option.querySelector('span').textContent);
            const type = option.querySelector('.flavor-type').textContent;
            if (qty > 0) {
                selectedFlavors.push({ flavor: label, quantity: qty, type: type });
            }
        });

        // Validate total = cookieCount
        const totalSelected = selectedFlavors.reduce((sum, f) => sum + f.quantity, 0);
        if (totalSelected !== cookieCount) {
            showNotification(`Please select exactly ${cookieCount} cookies for this box.`);
            return;
        }
        console.log("selectedFlavorsssssssssssssss", selectedFlavors)
        // Enforce Mix must contain at least one Chewy and one Crumble
        if (selectedStyle === 'mix') {
            const chewyCount = selectedFlavors.filter(f => f.type === 'chewy').reduce((s, f) => s + f.quantity, 0);
            const crumbleCount = selectedFlavors.filter(f => f.type === 'crumble').reduce((s, f) => s + f.quantity, 0);
            if (chewyCount === 0 || crumbleCount === 0) {
                showNotification('Mix of Both must include at least 1 Chewy and 1 Crumble.');
                return;
            }
        }

        const name = `${size.charAt(0).toUpperCase() + size.slice(1)} Box (${selectedStyle})`;

        const cart = getCart();
        cart.push({
            id: Date.now(),
            name: name,
            price: price,
            img: 'https://images.unsplash.com/photo-1587248720328-4daa08f11b9e?auto=format&fit=crop&w=600&h=400&q=80',
            quantity: 1,
            flavors: selectedFlavors, // now includes qty per flavor
            size: size,
            style: selectedStyle
        });

        saveCart(cart);
        updateCartUI();
        showNotification(`${name} added to cart!`);

        closeFlavorPopup();
    });


    // Checkout functionality
    const startCheckout = document.getElementById('start-checkout');

    // Start checkout process
    if (startCheckout) {
        startCheckout.addEventListener('click', function () {
            const cart = getCart();
            if (cart.length === 0) {
                showNotification('Your cart is empty!');
                return;
            }

            // Close cart sidebar
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
        });
    }
});