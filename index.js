// Global cart functionality using localStorage

const CART_KEY = 'syrines_crumble_cart';
let selectedBox = null;
let selectedStyle = 'chewy';
let cookiesData = {};

const mobileMenuBtnn = document.getElementById('mobile-menu-btn');
const mobileNav = document.createElement('div');
const mobileNavOverlay = document.createElement('div');

// Variables to store Supabase credentials
let SUPABASE_URL = null;
let SUPABASE_ANON_KEY = null;
let supabase = null;

// Fetch Supabase credentials from backend API
async function initializeSupabase() {
    try {
        const response = await fetch('https://backend-quiet-glitter-4571.fly.dev/supabase-keys');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { url, key } = await response.json();
        
        SUPABASE_URL = url;
        SUPABASE_ANON_KEY = key;
        
        // Initialize Supabase client
        if (typeof supabaseClient !== 'undefined') {
            supabase = supabaseClient;
        } else {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        
        console.log('Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return false;
    }
}

// Initialize Supabase when the script loads
let supabaseInitialized = false;




async function ensureSupabaseInitialized() {
    if (!supabaseInitialized) {
        supabaseInitialized = await initializeSupabase();
    }
    return supabaseInitialized;
}

let selectedFlavors = {};



// Function to fetch cookies from Supabase
// Update the fetchCookiesData function to match your table columns
async function fetchCookiesData() {
    try {
        const initialized = await ensureSupabaseInitialized();
        if (!initialized) {
            console.warn('Supabase not initialized, using fallback data');
            return getFallbackCookiesData();
        }

        const { data, error } = await supabase
            .from('cookies')
            .select('*')
            .eq('is_active', true)
            .order('created_at');

        if (error) {
            console.error('Error fetching cookies:', error);
            return getFallbackCookiesData();
        }

        // Transform the data to match your expected format
        const transformedData = {};
        data.forEach(cookie => {
            transformedData[cookie.slug] = {
                title: cookie.name,
                description: cookie.description,
                images: {
                    chewy: cookie.image_url_chewy,
                    crumble: cookie.image_url_crumble
                },
                price: `${cookie.chewy_price} LE`,
                ingredients: cookie.ingredients,
                specialty: cookie.specialty,
                perfectFor: cookie.perfect_for,
                tags: cookie.tags || [],
                chewy_price: cookie.chewy_price,
                crumble_price: cookie.crumble_price
            };
        });

        return transformedData;
    } catch (error) {
        console.error('Error in fetchCookiesData:', error);
        return getFallbackCookiesData();
    }
}

// Keep your fallback function as backup
function getFallbackCookiesData() {
    return {
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
            perfectFor: 'Chocolate lovers, classic cookie enthusiasts, and family gatherings',
            tags: ['popular'],
            chewy_price: 80,
            crumble_price: 80
        },
        // ... include all other cookies
    };
}


// Function to render cookies grid dynamically
async function renderCookiesGrid() {
    const cookiesGrid = document.querySelector('.cookies-grid');
    if (!cookiesGrid) return;

    // Show loading state
    cookiesGrid.innerHTML = '<div class="loading-cookies">Loading cookies...</div>';

    // Fetch cookies data
    cookiesData = await fetchCookiesData();

    // Clear loading state and render cookies
    cookiesGrid.innerHTML = '';

    Object.keys(cookiesData).forEach(slug => {
        const cookie = cookiesData[slug];
        const cookieCard = document.createElement('div');
        cookieCard.className = 'cookie-card';
        cookieCard.onclick = () => openPopup(slug);

        let tagsHTML = '';
        if (cookie.tags && cookie.tags.length > 0) {
            cookie.tags.forEach(tag => {
                tagsHTML += `<div class="cookie-tag">${tag.charAt(0).toUpperCase() + tag.slice(1)}</div>`;
            });
        }

        cookieCard.innerHTML = `
            <div class="click-indicator">
                <i class="fas fa-hand-pointer"></i> Click for details
            </div>
            <div class="cookie-image">
                <img src="${cookie.images.chewy}" alt="${cookie.title}" loading="lazy">
                ${tagsHTML}
            </div>
            <div class="cookie-details">
                <h3>${cookie.title}</h3>
                <p>${cookie.description}</p>
                <div class="cookie-options">
                    <div class="cookie-price">${cookie.chewy_price} LE</div>
                </div>
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); openPopup('${slug}')">
                    Choose
                </button>
            </div>
        `;

        cookiesGrid.appendChild(cookieCard);
    });
}


// Mobile menu functionality
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mainNav = document.querySelector('.main-nav');

// Price service to handle database operations
const priceService = {
    // Get all current prices from database
    // In your priceService.getCurrentPrices() function, update the cookies part:
async getCurrentPrices() {
    const initialized = await ensureSupabaseInitialized();
    if (!initialized) {
        return this.getFallbackPrices();
    }

    try {
        const [cookiesResponse, boxesResponse, mysteryResponse] = await Promise.all([
            supabase.from('cookies').select('slug, chewy_price, crumble_price').eq('is_active', true),
            supabase.from('boxes').select('size, chewy_price, crumble_price, mix_price, cookie_count').eq('is_active', true),
            supabase.from('mystery_boxes').select('price').eq('is_active', true).single()
        ]);

        if (cookiesResponse.error) throw cookiesResponse.error;
        if (boxesResponse.error) throw boxesResponse.error;
        if (mysteryResponse.error) throw mysteryResponse.error;

        return {
            cookies: cookiesResponse.data || [],
            boxes: boxesResponse.data || [],
            mystery: mysteryResponse.data?.price || 450
        };
    } catch (error) {
        console.error('Error fetching prices:', error);
        return this.getFallbackPrices();
    }
},

    // Fallback prices in case database is unavailable
    getFallbackPrices() {
        return {
            cookies: [
                { slug: 'chocolate-chip', chewy_price: 80, crumble_price: 80 },
                { slug: 'chocolate-crispy', chewy_price: 90, crumble_price: 90 },
                { slug: 'caramel', chewy_price: 85, crumble_price: 85 },
                { slug: 'hazelnut', chewy_price: 95, crumble_price: 95 },
                { slug: 'lotus', chewy_price: 85, crumble_price: 85 }
            ],
            boxes: [
                { size: 'duo', chewy_price: 155, crumble_price: 155, mix_price: 165, cookie_count: 2 },
                { size: 'trio', chewy_price: 245, crumble_price: 245, mix_price: 255, cookie_count: 3 },
                { size: 'classic', chewy_price: 320, crumble_price: 320, mix_price: 335, cookie_count: 4 },
                { size: 'craver', chewy_price: 480, crumble_price: 480, mix_price: 505, cookie_count: 6 },
                { size: 'feast', chewy_price: 675, crumble_price: 675, mix_price: 700, cookie_count: 9 }
            ],
            mystery: 450
        };
    },


    // Validate cart items against current prices
    async validateCart(cartItems) {
        const currentPrices = await this.getCurrentPrices();
        const validItems = [];
        let total = 0;
        let hasChanges = false;

        for (const item of cartItems) {
            let isValid = false;
            let correctUnitPrice = 0;

            // Validate single cookies
            if (item.cookieType) {
                const cookiePrice = currentPrices.cookies.find(c => c.slug === item.cookieType);
                if (cookiePrice) {
                    correctUnitPrice = cookiePrice[`${item.style}_price`];
                    isValid = item.unitPrice === correctUnitPrice;
                }
            }
            // Validate boxes
            else if (item.size && item.size !== 'mystery') {
                const boxPrice = currentPrices.boxes.find(b => b.size === item.size);
                if (boxPrice) {
                    const priceKey = item.style === 'mix' ? 'mix_price' : `${item.style}_price`;
                    correctUnitPrice = boxPrice[priceKey];
                    isValid = item.unitPrice === correctUnitPrice;
                }
            }
            // Validate mystery box
            else if (item.size === 'mystery') {
                correctUnitPrice = currentPrices.mystery;
                isValid = item.unitPrice === correctUnitPrice;
            }

            if (isValid) {
                // Update price based on current quantity
                item.price = correctUnitPrice * item.quantity;
                total += item.price;
                validItems.push(item);
            } else {
                hasChanges = true;
                console.warn('Invalid item removed from cart:', item);
            }
        }

        return { validItems, total, hasChanges };
    }
};

// Global variable to store current prices
let currentPrices = null;

// Toggle mobile menu
function toggleMobileMenu() {
    mainNav.classList.toggle('active');
}

// Open mobile navigation
function openMobileNav() {
    mobileNav.classList.add('active');
    mobileNavOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close all modals on escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    enableBodyScroll();
    // Add your close functions for all modals here
    closePopup();
    closeFlavorPopup();
    if (cartSidebar) cartSidebar.classList.remove('active');
    if (cartOverlay) cartOverlay.classList.remove('active');
    if (mainNav) mainNav.classList.remove('active');
  }
});

// Close mobile menu when a link is clicked
function setupMobileMenu() {
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && mainNav.classList.contains('active')) {
                enableBodyScroll();
                } else if (window.innerWidth <= 768) {
                disableBodyScroll();
                }
            e.stopPropagation();
            toggleMobileMenu();
        });

        // Close mobile menu when nav links are clicked
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    mainNav.classList.remove('active');
                }
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && 
                mainNav.classList.contains('active') &&
                !e.target.closest('.main-nav') && 
                !e.target.closest('.mobile-menu-btn')) {
                mainNav.classList.remove('active');
            }
        });
    }
}

// Close mobile navigation
function closeMobileNav() {
    mobileNav.classList.remove('active');
    mobileNavOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

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

// Update the openPopup function to use dynamic data
function openPopup(cookieType) {
    disableBodyScroll();
    currentCookie = cookieType;
    currentStyle = 'chewy';
    quantity = 1;
    
    const cookie = cookiesData[cookieType];
    if (!cookie) {
        console.error('Cookie not found:', cookieType);
        return;
    }
    
    document.getElementById('popupTitle').textContent = cookie.title;
    document.getElementById('popupDescription').textContent = cookie.description;
    document.getElementById('popupImage').style.backgroundImage = `url(${cookie.images.chewy})`;
    document.getElementById('popupPrice').textContent = `${cookie.chewy_price} LE`;
    document.getElementById('popupIngredients').textContent = cookie.ingredients;
    document.getElementById('popupSpecialty').textContent = cookie.specialty;
    document.getElementById('popupPerfectFor').textContent = cookie.perfectFor;
    document.getElementById('quantityValue').textContent = quantity;
    
    document.querySelectorAll('.popup-style-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.popup-style-option[data-style="chewy"]').classList.add('active');
    
    document.getElementById('popupOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePopup() {
    enableBodyScroll();
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

// Add single cookie from popup - SECURE VERSION
async function addToCartFromPopup() {
    if (!currentCookie) {
        showNotification('Error: No cookie selected');
        return;
    }

    // Get price from database instead of DOM
    const cookiePrice = await getCookiePrice(currentCookie, currentStyle);
    if (!cookiePrice) {
        showNotification('Error: Could not verify price. Please try again.');
        return;
    }

    const unitPrice = cookiePrice;
    const qty = quantity || 1;
    const cookieName = document.getElementById('popupTitle').textContent;
    
    const name = `${cookieName} (${currentStyle.charAt(0).toUpperCase() + currentStyle.slice(1)})`;

    // Build cart object with secure prices
    const cart = getCart();
    cart.push({
        id: Date.now(),
        name: name,
        unitPrice: unitPrice, // Store unit price from database
        price: unitPrice * qty, // Calculate total
        img: cookieData[currentCookie]?.images[currentStyle] || 'images/default_cookie.svg',
        quantity: qty,
        style: currentStyle,
        cookieType: currentCookie // Store for validation
    });

    saveCart(cart);
    updateCartUI();
    showNotification(`${name} added to cart!`);

    // Visual feedback
    // const addButton = document.querySelector('.popup-add-to-cart');
    // addButton.innerHTML = '<i class="fas fa-check"></i> Added!';
    // addButton.style.background = '#2e8b57';
    closePopup();

    // Reset quantity
    quantity = 1;
    document.getElementById('quantityValue').textContent = quantity;
}

// Helper function to get cookie price from database
async function getCookiePrice(cookieSlug, style) {
    if (!currentPrices) {
        currentPrices = await priceService.getCurrentPrices();
    }
    
    const cookie = currentPrices.cookies.find(c => c.slug === cookieSlug);
    return cookie ? cookie[`${style}_price`] : null;
}

// Helper function to get box price from database
async function getBoxPrice(boxSize, style) {
    if (!currentPrices) {
        currentPrices = await priceService.getCurrentPrices();
    }
    
    const box = currentPrices.boxes.find(b => b.size === boxSize);
    if (!box) return null;
    
    return style === 'mix' ? box.mix_price : box[`${style}_price`];
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
    console.log("cart", cart);
}

// Update cart UI with validation
async function updateCartUI() {
    const cart = getCart();
    
    // Validate cart against current prices
    const validation = await priceService.validateCart(cart);
    
    if (validation.hasChanges) {
        saveCart(validation.validItems);
        showNotification('Cart updated with current prices');
    }

    const validatedCart = validation.validItems;
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    let total = 0;

    // Update cart count
    const totalItems = validatedCart.reduce((total, item) => total + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;

    // Update cart items if cart sidebar exists
    if (cartItems) {
        cartItems.innerHTML = '';

        if (validatedCart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
            if (cartTotal) cartTotal.textContent = 'LE 0.00 EGP';
            return;
        }

        validatedCart.forEach((item, index) => {
            const itemTotal = item.unitPrice * item.quantity;
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
                    <div class="cart-item-price">EGP ${itemTotal}</div>
                    
                    ${flavorHTML}
                    
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
        if (cartTotal) cartTotal.textContent = `EGP ${total}`;

        // Add event listeners to cart items
        document.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', async function () {
                const index = parseInt(this.getAttribute('data-index'));
                const cart = getCart();
                cart[index].quantity++;
                
                // Revalidate price
                const validation = await priceService.validateCart([cart[index]]);
                if (validation.validItems.length > 0) {
                    cart[index].price = validation.validItems[0].price;
                }
                
                saveCart(cart);
                updateCartUI();
            });
        });

        document.querySelectorAll('.decrease-quantity').forEach(button => {
            button.addEventListener('click', async function () {
                const index = parseInt(this.getAttribute('data-index'));
                const cart = getCart();
                if (cart[index].quantity > 1) {
                    cart[index].quantity--;
                    
                    // Revalidate price
                    const validation = await priceService.validateCart([cart[index]]);
                    if (validation.validItems.length > 0) {
                        cart[index].price = validation.validItems[0].price;
                    }
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

// Cart sidebar toggle
const cartIcon = document.getElementById('cart-icon');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCart = document.getElementById('close-cart');
const cartOverlay = document.getElementById('cart-overlay');

// Also update cart sidebar functions
if (cartIcon && cartSidebar) {
  cartIcon.addEventListener('click', function () {
    if (window.innerWidth <= 768) {
      disableBodyScroll();
    }
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
  });

  closeCart.addEventListener('click', function () {
    if (window.innerWidth <= 768) {
      enableBodyScroll();
    }
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
  });

  cartOverlay.addEventListener('click', function () {
    if (window.innerWidth <= 768) {
      enableBodyScroll();
    }
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
  });
}

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
const headerTabs = document.querySelector('.header-tabs');

if (mobileMenuBtn && headerTabs) {
    mobileMenuBtn.addEventListener('click', function () {
        headerTabs.classList.toggle('active');
    });
}


function disableBodyScroll() {
  document.body.classList.add('body-no-scroll');
  document.documentElement.style.overflow = 'hidden';
}


// Performance optimization: Load non-critical scripts after page load
        window.addEventListener('load', function() {
            // Hide loading screen
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
            
            // Load non-critical scripts
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = function() {
                // Load main script after Supabase
                const mainScript = document.createElement('script');
                mainScript.src = 'index.js';
                document.body.appendChild(mainScript);
            };
            document.body.appendChild(script);
        });

function enableBodyScroll() {
  document.body.classList.remove('body-no-scroll');
  document.documentElement.style.overflow = '';
}

async function initializeSupabaseWithTimeout() {
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    try {
        await Promise.race([initializeSupabase(), timeoutPromise]);
        console.log('Supabase initialized successfully');
    } catch (error) {
        console.warn('Supabase initialization timed out, using fallback prices');
        // Use fallback prices immediately
        currentPrices = priceService.getFallbackPrices();
        supabaseInitialized = true;
    }
}

// Tab functionality
document.addEventListener('DOMContentLoaded', async function () {
    // Initialize Supabase first

    await initializeSupabaseWithTimeout();
    await ensureSupabaseInitialized();

    // Initialize prices
    currentPrices = await priceService.getCurrentPrices();
    console.log('Prices loaded successfully:', currentPrices);
    await renderCookiesGrid(); // Add this line
    
    setupMobileMenu(); 
    
    const tabBtns = document.querySelectorAll('.header-tabs .tab-btn');
    const footerTabLinks = document.querySelectorAll('.footer-tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const cookies = document.querySelectorAll('.cookie-character');
    const btn = document.querySelector(".mystery-btn");

    btn.addEventListener("click", () => {
        btn.textContent = "🎉 Added to Cart!";
        setTimeout(() => {
            btn.textContent = "Order Mystery Box";
        }, 2000);
    });

    // Event listener for mobile menu button
    mobileMenuBtnn.addEventListener('click', openMobileNav);

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

    // Event listeners for desktop nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Update tab switching to work with new navigation
    function switchTab(tabId) {
        enableBodyScroll()
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked button
        const activeNavLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }
        
        // Remove active class from all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show corresponding content
        const activeTab = document.getElementById(`${tabId}-tab`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Close mobile menu if open
        if (window.innerWidth <= 768 && mainNav.classList.contains('active')) {
            mainNav.classList.remove('active');
        }
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
        disableBodyScroll()
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
                    if (qty > 0) {
                        const flavorDiv = document.createElement('div');
                        flavorDiv.className = 'selected-flavor-item';
                        
                        // Find the flavor name
                        const flavorName = flavors.find(f => `${f.id}-${f.type}` === id)?.name || 'Unknown Flavor';
                        const flavorType = flavors.find(f => `${f.id}-${f.type}` === id)?.type || 'Unknown Flavor';
                        
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

    function closeFlavorPopup() {
        enableBodyScroll()
        document.getElementById('flavor-popup-overlay').classList.remove('active');
        document.getElementById('flavor-popup').classList.remove('active');
    }

    // Secure checkout process
    document.getElementById("start-checkout").addEventListener("click", async function (e) {
        e.preventDefault();
        
        const cart = getCart();
        if (cart.length === 0) {
            showNotification('Your cart is empty!');
            return;
        }

        // Final price validation before checkout
        const validation = await priceService.validateCart(cart);
        
        if (validation.validItems.length === 0) {
            showNotification('Your cart items are no longer available. Please refresh the page.');
            return;
        }

        if (validation.hasChanges) {
            // Update cart with current prices
            saveCart(validation.validItems);
            updateCartUI();
            
            showNotification('Cart updated with current prices. Please review before checkout.');
            return;
        }

        // All good - proceed to checkout
        window.location.href = "checkout.html";
    });

    // Add box from popup - SECURE VERSION
    document.getElementById('add-box-from-popup').addEventListener('click', async function () {
        if (!selectedBox) {
            showNotification('Please select a box first!');
            return;
        }

        const size = selectedBox.getAttribute('data-size');
        const cookieCount = getCookieCount(size);

        // Get price from database instead of DOM
        const unitPrice = await getBoxPrice(size, selectedStyle);
        if (!unitPrice) {
            showNotification('Error: Could not verify box price. Please try again.');
            return;
        }

        // Collect flavors with quantities
        const selectedFlavors = [];
        document.querySelectorAll('#popup-flavor-grid .flavor-option').forEach(option => {
            const flavorName = option.querySelector('.flavor-name').textContent;
            const qty = parseInt(option.querySelector('span').textContent);
            const type = option.querySelector('.flavor-type').textContent;
            if (qty > 0) {
                selectedFlavors.push({ flavor: flavorName, quantity: qty, type: type });
            }
        });

        // Validate total = cookieCount
        const totalSelected = selectedFlavors.reduce((sum, f) => sum + f.quantity, 0);
        if (totalSelected !== cookieCount) {
            showNotification(`Please select exactly ${cookieCount} cookies for this box.`);
            return;
        }

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
            unitPrice: unitPrice, // From database
            price: unitPrice, // Total price for 1 box
            img: selectedBox.getAttribute('data-img'),
            quantity: 1,
            flavors: selectedFlavors,
            size: size,
            style: selectedStyle
        });

        saveCart(cart);
        updateCartUI();
        showNotification(`${name} added to cart!`);

        closeFlavorPopup();
    });

    // Add Mystery Box - SECURE VERSION
    document.querySelector('.mystery-btn').addEventListener('click', async function () {
        if (!currentPrices) {
            currentPrices = await priceService.getCurrentPrices();
        }

        const name = "Mystery Box";
        const unitPrice = currentPrices.mystery; // From database
        const img = "images/mystery.svg";

        const cart = getCart();
        cart.push({
            id: Date.now(),
            name: name,
            unitPrice: unitPrice,
            price: unitPrice, // Total price for 1 box
            img: img,
            quantity: 1,
            flavors: [],
            size: "mystery",
            style: "surprise"
        });

        saveCart(cart);
        updateCartUI();
        showNotification(`${name} added to cart!`);
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

    // Initialize cart UI after everything is loaded
    updateCartUI();
});
