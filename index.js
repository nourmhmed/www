

const CART_KEY = 'syrines_crumble_cart';
let selectedBox = null;
let selectedStyle = 'chewy';
let cookiesData = {};
// Fighting Animation functionality
let isFighting = false;
let allCookiesData = {};

// Global loading state management
let loadingProgress = 0;
let totalTasks = 5; // Adjust based on how many data sources you're loading
// Add a timeout fallback in case loading gets stuck
let loadingTimeout;


// Add these with your other global variables
let boxesData = [];
let mysteryBoxData = null;



// Variables to store Supabase credentials
let SUPABASE_URL = null;
let SUPABASE_ANON_KEY = null;
let supabase = null;
function setupLoadingTimeout() {
    loadingTimeout = setTimeout(() => {
        console.warn('Loading timeout reached, forcing completion');
        updateLoadingProgress(100);
    }, 15000); // 15 second timeout
}

// Clear timeout when loading completes
function clearLoadingTimeout() {
    if (loadingTimeout) {
        clearTimeout(loadingTimeout);
    }
}

// Ensure mobile menu setup runs once after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupMobileMenu();
});

// Update the updateLoadingProgress function to clear timeout
function updateLoadingProgress(increment = 20) {
    loadingProgress += increment;
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill && progressText) {
        progressFill.style.width = `${loadingProgress}%`;
        progressText.textContent = `${loadingProgress}%`;
    }
    
    // Hide loading screen when complete
    if (loadingProgress >= 100) {
        clearLoadingTimeout();
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    // Re-enable body scroll
                    document.body.style.overflow = 'auto';
                }, 500);
            }
        }, 500);
    }
}
// Add this to your initializeSupabase function
async function initializeSupabase() {
    try {
        const response = await fetch('https://backend-quiet-glitter-4571.fly.dev/supabase-keys');
        if (!response.ok) throw new Error('Failed to fetch Supabase keys');
        
        const { url, key } = await response.json();
        SUPABASE_URL = url;
        SUPABASE_ANON_KEY = key;
        
        // Initialize Supabase client
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Test connection
        const { error } = await supabase.from('cookies').select('count').limit(1);
        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Supabase initialization failed:', error);
        return false;
    }
}


function initializeVSBattle() {
    const vsBattle = document.getElementById('vs-battle');
    const vsCircle = document.getElementById('vs-circle');
    const svgContainer = document.querySelector('.svg-container');
    const vsSubtitle = document.querySelector('.vs-subtitle');

    // Debug: Check if elements exist
    console.log('VS Battle Elements:', {
        vsBattle: !!vsBattle,
        vsCircle: !!vsCircle,
        svgContainer: !!svgContainer,
        vsSubtitle: !!vsSubtitle
    });

    if (!vsBattle || !svgContainer) {
        console.error('VS Battle: Required elements not found');
        return;
    }

    // Find team containers - more flexible approach
    const teamContainers = document.querySelectorAll('.team-container');
    let crumbleContainer, chewyContainer;

    teamContainers.forEach(container => {
        const img = container.querySelector('img');
        if (img) {
            if (img.classList.contains('crumble-img')) {
                crumbleContainer = container;
                container.classList.add('crumble');
            } else if (img.classList.contains('chewy-img')) {
                chewyContainer = container;
                container.classList.add('chewy');
            }
        }
    });

    // Alternative: Find by team label
    if (!crumbleContainer || !chewyContainer) {
        teamContainers.forEach(container => {
            const label = container.querySelector('.team-label');
            if (label) {
                if (label.textContent.toLowerCase().includes('crumble')) {
                    crumbleContainer = container;
                    container.classList.add('crumble');
                } else if (label.textContent.toLowerCase().includes('chewy')) {
                    chewyContainer = container;
                    container.classList.add('chewy');
                }
            }
        });
    }

    // Debug: Check if team containers were found
    console.log('Team Containers:', {
        crumbleContainer: !!crumbleContainer,
        chewyContainer: !!chewyContainer,
        totalContainers: teamContainers.length
    });

    if (!crumbleContainer || !chewyContainer) {
        console.error('VS Battle: Could not find both team containers');
        return;
    }

    vsBattle.addEventListener('click', async function() {
        if (isFighting) return;
        
        isFighting = true;
        
        // Update subtitle
        if (vsSubtitle) {
            vsSubtitle.textContent = 'Fighting!';
        }

        // VS button animation
        vsCircle.classList.add('battle-active');

        try {
            // Phase 1: Charge towards each other
            crumbleContainer.classList.add('fighting-crumble');
            chewyContainer.classList.add('fighting-chewy');

            // Wait for charge animation to complete
            await new Promise(resolve => setTimeout(resolve, 600));

            // Phase 2: Impact effects
            createImpactEffects();
            
            // Add impact animation to cookies
            const cookies = document.querySelectorAll('.cookie-img');
            cookies.forEach(cookie => {
                cookie.classList.add('cookie-impact');
            });

            // Swap speech bubbles during impact
            swapSpeechBubbles();

            // Play impact sound
            playImpactSound();

            // Wait for impact effects
            await new Promise(resolve => setTimeout(resolve, 400));

            // Phase 3: Return to original positions
            crumbleContainer.classList.remove('fighting-crumble');
            chewyContainer.classList.remove('fighting-chewy');
            crumbleContainer.classList.add('return-crumble');
            chewyContainer.classList.add('return-chewy');

            // Remove impact animation
            cookies.forEach(cookie => {
                cookie.classList.remove('cookie-impact');
            });

            // Wait for return animation
            await new Promise(resolve => setTimeout(resolve, 800));

        } catch (error) {
            console.error('VS Battle animation error:', error);
        } finally {
            // Clean up - always run this
            crumbleContainer.classList.remove('return-crumble', 'fighting-crumble');
            chewyContainer.classList.remove('return-chewy', 'fighting-chewy');
            vsCircle.classList.remove('battle-active');

            // Update subtitle
            if (vsSubtitle) {
                vsSubtitle.textContent = 'Click to Battle!';
            }

            isFighting = false;
        }
    });

    // Add hover effects
    vsBattle.addEventListener('mouseenter', function() {
        if (vsSubtitle && !isFighting) {
            vsSubtitle.style.animationPlayState = 'paused';
            vsSubtitle.style.opacity = '1';
            vsSubtitle.style.transform = 'translateY(-3px)';
        }
    });

    vsBattle.addEventListener('mouseleave', function() {
        if (vsSubtitle && !isFighting) {
            vsSubtitle.style.animationPlayState = 'running';
        }
    });
}

// Update the initCookieShowcase function
function initCookieShowcase() {
    const showMoreBtn = document.getElementById('showMoreCookiesBtn');
    
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function() {
            console.log('Explore All Cookies clicked - switching to cookies tab');
            // Switch to cookies tab
            switchTab('cookies');
        });
    }
    
    // Fix for add to cart buttons in showcase
    document.addEventListener('click', function(e) {
        // Handle showcase add buttons
        if (e.target.classList.contains('showcase-add-btn') || e.target.closest('.showcase-add-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.classList.contains('showcase-add-btn') ? e.target : e.target.closest('.showcase-add-btn');
            const slug = button.getAttribute('data-cookie-slug');
            
            if (slug) {
                console.log('Showcase button clicked:', slug);
                openPopup(slug);
            } else {
                console.warn('No slug found on showcase button');
            }
        }
    });
}


// Rest of the functions remain the same...
function createImpactEffects() {
    const svgContainer = document.querySelector('.svg-container');
    if (!svgContainer) return;
    
    // Create impact flash
    const flash = document.createElement('div');
    flash.className = 'impact-flash';
    svgContainer.appendChild(flash);
    
    // Create shockwave
    const shockwave = document.createElement('div');
    shockwave.className = 'shockwave';
    svgContainer.appendChild(shockwave);
    
    // Create dust explosion
    const dustEffect = document.createElement('div');
    dustEffect.className = 'dust-effect';
    svgContainer.appendChild(dustEffect);
    
    // Create multiple dust particles
    for (let i = 0; i < 15; i++) {
        const dust = document.createElement('div');
        dust.className = 'dust-particle';
        
        // Random direction and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 70;
        const dustX = Math.cos(angle) * distance;
        const dustY = Math.sin(angle) * distance;
        
        // Random size
        const size = 3 + Math.random() * 8;
        
        dust.style.setProperty('--dust-x', `${dustX}px`);
        dust.style.setProperty('--dust-y', `${dustY}px`);
        dust.style.width = `${size}px`;
        dust.style.height = `${size}px`;
        dust.style.animationDelay = `${Math.random() * 0.3}s`;
        
        dustEffect.appendChild(dust);
    }
    
    // Remove effects after animation
    setTimeout(() => {
        flash.remove();
        shockwave.remove();
        dustEffect.remove();
    }, 1000);
}

function swapSpeechBubbles() {
    const crumbleBubble = document.querySelector('.crumble-bubble');
    const chewyBubble = document.querySelector('.chewy-bubble');

    if (crumbleBubble && chewyBubble) {
        // Swap the bubble content temporarily
        const tempHTML = crumbleBubble.innerHTML;
        crumbleBubble.innerHTML = chewyBubble.innerHTML;
        chewyBubble.innerHTML = tempHTML;

        // Add animation to bubbles
        [crumbleBubble, chewyBubble].forEach(bubble => {
            bubble.style.animation = 'bubbleSwap 0.5s ease-in-out';
            setTimeout(() => {
                bubble.style.animation = '';
            }, 500);
        });
    }
}

function playImpactSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create impact sound (low frequency thud)
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
    } catch (error) {
        console.log('Audio not supported');
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes bubbleSwap {
        0% { opacity: 1; transform: translateY(0) scale(1); }
        50% { opacity: 0; transform: translateY(-20px) scale(0.8); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    
    @keyframes vsPulse {
        0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 25px rgba(200, 6, 6, 0.4);
        }
        50% {
            transform: scale(1.1);
            box-shadow: 0 12px 35px rgba(200, 6, 6, 0.6);
        }
    }
    
    @keyframes vsBattleActive {
        0%, 100% {
            transform: scale(1);
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
        }
        25% {
            transform: scale(1.2);
            background: linear-gradient(135deg, #ff6b6b, #c0394f);
        }
        50% {
            transform: scale(0.9);
            background: linear-gradient(135deg, #ffd700, #ffa500);
        }
        75% {
            transform: scale(1.1);
            background: linear-gradient(135deg, #c0394f, #ff6b6b);
        }
    }
`;
document.head.appendChild(style);


// Initialize Supabase when the script loads
let supabaseInitialized = false;




async function ensureSupabaseInitialized() {
    if (!supabaseInitialized) {
        supabaseInitialized = await initializeSupabase();
    }
    return supabaseInitialized;
}

let selectedFlavors = {};


// Function to fetch boxes data
async function fetchBoxesData() {
    try {
        const initialized = await ensureSupabaseInitialized();
        if (!initialized) {
            console.warn('Supabase not initialized, using fallback boxes data');
            return getFallbackBoxesData();
        }

        const { data, error } = await supabase
            .from('boxes')
            .select('*')
            .eq('is_active', true)
            .order('cookie_count');

        if (error) {
            console.error('Error fetching boxes:', error);
            return getFallbackBoxesData();
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchBoxesData:', error);
        return getFallbackBoxesData();
    }
}

// Function to fetch mystery box data
async function fetchMysteryBoxData() {
    try {
        const initialized = await ensureSupabaseInitialized();
        if (!initialized) {
            console.warn('Supabase not initialized, using fallback mystery box data');
            return getFallbackMysteryBoxData();
        }

        const { data, error } = await supabase
            .from('mystery_boxes')
            .select('*')
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('Error fetching mystery box:', error);
            return getFallbackMysteryBoxData();
        }

        return data;
    } catch (error) {
        console.error('Error in fetchMysteryBoxData:', error);
        return getFallbackMysteryBoxData();
    }
}

// Fallback data for boxes
function getFallbackBoxesData() {
    return [
        {
            size: 'duo',
            name: 'The Duo',
            description: '2 cookies—perfect for a quick fix',
            chewy_price: 155,
            crumble_price: 155,
            mix_price: 165,
            cookie_count: 2,
            image_url: 'images/duo.svg'
        },
        // ... include all other boxes from your static data
    ];
}

document.querySelectorAll('.footer-column a[data-tab]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const tabId = this.getAttribute('data-tab');
        switchTab(tabId);
        
        // Scroll to top when navigating
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// Fallback data for mystery box
function getFallbackMysteryBoxData() {
    return {
        name: 'Mystery Box',
        price: 450,
        description: "Can't decide which cookies to choose? Let us surprise you with our mystery box! Each box contains 6 assorted cookies (bestsellers + seasonal specials), 1 limited edition flavor not available elsewhere, and a surprise gift with every order.",
        image_url: 'images/mystery.svg',
        contents: '6 assorted cookies (bestsellers + seasonal specials), 1 limited edition flavor not available elsewhere, A surprise gift with every order',
        special_features: ['limited-edition', 'surprise-gift', 'assorted']
    };
}


// Enhanced fetch functions with loading states
async function fetchCookiesData() {
    try {
        const initialized = await ensureSupabaseInitialized();
        if (!initialized) {
            console.warn('Supabase not initialized, using fallback data');
            allCookiesData = getFallbackCookiesData();
            return allCookiesData;
        }

        const { data, error } = await supabase
            .from('cookies')
            .select('*')
            .eq('is_active', true)
            .order('created_at');

        if (error) {
            console.error('Error fetching cookies:', error);
            allCookiesData = getFallbackCookiesData();
            return allCookiesData;
        }

        // Transform the data and store globally
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

        allCookiesData = transformedData;
        console.log('Cookies data loaded:', Object.keys(allCookiesData));
        return allCookiesData;
    } catch (error) {
        console.error('Error in fetchCookiesData:', error);
        allCookiesData = getFallbackCookiesData();
        return allCookiesData;
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

// Update the render functions to use a more robust image loading approach
async function renderBoxes() {
    try {
        console.log('Rendering boxes...');
        const boxOptions = document.querySelector('.box-options');
        if (!boxOptions) {
            console.warn('Box options container not found');
            return;
        }

        // Show loading state
        boxOptions.innerHTML = '<div class="loading-boxes">📦 Loading our amazing boxes...</div>';

        // Fetch boxes data
        boxesData = await fetchBoxesData();

        // Clear loading state and render boxes
        boxOptions.innerHTML = '';

        if (!boxesData || boxesData.length === 0) {
            boxOptions.innerHTML = '<div class="error-message">😢 No boxes available at the moment.</div>';
            return;
        }

        boxesData.forEach(box => {
            const boxOption = document.createElement('div');
            boxOption.className = 'box-option';
            boxOption.setAttribute('data-size', box.size);
            boxOption.setAttribute('data-chewy', box.chewy_price);
            boxOption.setAttribute('data-crumble', box.crumble_price);
            boxOption.setAttribute('data-mix', box.mix_price);
            boxOption.setAttribute('data-img', box.image_url);

            // Determine price display
            let priceDisplay = '';
            if (box.chewy_price === box.crumble_price) {
                priceDisplay = `${box.chewy_price} LE`;
            } else {
                const minPrice = Math.min(box.chewy_price, box.crumble_price);
                const maxPrice = Math.max(box.chewy_price, box.crumble_price);
                priceDisplay = `${minPrice} - ${maxPrice} LE`;
            }

            boxOption.innerHTML = `
                <div class="image-loading-container">
                    <div class="image-loading"></div>
                    <img src="${box.image_url}" alt="${box.name}" class="box-img" loading="lazy">
                </div>
                <h4>${box.name}</h4>
                <p>${box.description}</p>
                <div class="box-prices">
                    <span class="price-display">${priceDisplay}</span>
                </div>
            `;

            // Add individual image load/error handlers
            const img = boxOption.querySelector('img');
            setupImageHandlers(img);

            // Add click event
            boxOption.addEventListener('click', function() {
                selectedBox = this;
                showFlavorPopup(box.size, box.cookie_count, this);
            });

            boxOptions.appendChild(boxOption);
        });

        console.log('Boxes rendered successfully:', boxesData.length, 'boxes');
    } catch (error) {
        console.error('Error rendering boxes:', error);
        const boxOptions = document.querySelector('.box-options');
        if (boxOptions) {
            boxOptions.innerHTML = '<div class="error-message">😢 Failed to load boxes. Please try refreshing the page.</div>';
        }
    }
}


async function renderMysteryBox() {
    try {
        console.log('Rendering mystery box...');
        const mysterySection = document.querySelector('.mystery-content');
        if (!mysterySection) {
            console.warn('Mystery section not found');
            return;
        }

        // Fetch mystery box data
        mysteryBoxData = await fetchMysteryBoxData();

        if (!mysteryBoxData) {
            mysterySection.innerHTML = '<div class="error-message">😢 Mystery box not available at the moment.</div>';
            return;
        }

        mysterySection.innerHTML = `
            <!-- Left Image -->
            <div class="mystery-image">
                <div class="image-loading-container">
                    <div class="image-loading"></div>
                    <img src="${mysteryBoxData.image_url}" alt="${mysteryBoxData.name}" loading="lazy">
                </div>
                <div class="question-mark">?</div>
            </div>

            <!-- Right Details -->
            <div class="mystery-details">
                <h3>🎁 ${mysteryBoxData.name}</h3>
                <p>${mysteryBoxData.description}</p>
                <ul>
                    ${mysteryBoxData.contents ? mysteryBoxData.contents.split(',').map(item => 
                        `<li>${item.trim()}</li>`
                    ).join('') : `
                        <li>🍪 6 assorted cookies (bestsellers + seasonal specials)</li>
                        <li>🌟 1 limited edition flavor not available elsewhere</li>
                        <li>🎉 A surprise gift with every order</li>
                    `}
                </ul>
                <div class="mystery-price">${mysteryBoxData.price} LE</div>
                <p class="mystery-note">✨ Contents change daily based on what's fresh and delicious!</p>
                <button class="btn mystery-btn">Order Mystery Box</button>
            </div>
        `;

        // Setup image handlers for mystery box
        const mysteryImg = mysterySection.querySelector('.mystery-image img');
        if (mysteryImg) {
            setupImageHandlers(mysteryImg);
        }

        // Add event listener to the mystery button
        const mysteryBtn = mysterySection.querySelector('.mystery-btn');
        if (mysteryBtn) {
            mysteryBtn.addEventListener('click', async function() {
                if (!mysteryBoxData) {
                    showNotification('Mystery box data not available');
                    return;
                }

                const name = mysteryBoxData.name;
                const unitPrice = mysteryBoxData.price;
                const img = mysteryBoxData.image_url;

                const cart = getCart();
                cart.push({
                    id: Date.now(),
                    name: name,
                    unitPrice: unitPrice,
                    price: unitPrice,
                    img: img,
                    quantity: 1,
                    flavors: [],
                    size: "mystery",
                    style: "surprise"
                });

                saveCart(cart);
                updateCartUI();
                showNotification(`${name} added to cart!`);

                // Visual feedback
                this.textContent = "🎉 Added to Cart!";
                setTimeout(() => {
                    this.textContent = "Order Mystery Box";
                }, 2000);
            });
        }

        console.log('Mystery box rendered successfully');
    } catch (error) {
        console.error('Error rendering mystery box:', error);
        const mysterySection = document.querySelector('.mystery-content');
        if (mysterySection) {
            mysterySection.innerHTML = '<div class="error-message">😢 Failed to load mystery box details.</div>';
        }
    }
}

// Update renderCookiesGrid to use global data
async function renderCookiesGrid() {
    try {
        console.log('Rendering cookies grid...');
        const cookiesGrid = document.querySelector('.cookies-grid');
        if (!cookiesGrid) {
            console.warn('Cookies grid not found');
            return;
        }

        // Show loading state
        cookiesGrid.innerHTML = '<div class="loading-cookies">🍪 Loading our delicious cookies...</div>';

        // Use global cookies data
        const cookiesData = allCookiesData;

        // Clear loading state and render cookies
        cookiesGrid.innerHTML = '';

        if (!cookiesData || Object.keys(cookiesData).length === 0) {
            cookiesGrid.innerHTML = '<div class="error-message">😢 No cookies available at the moment.</div>';
            return;
        }

        Object.keys(cookiesData).forEach(slug => {
            const cookie = cookiesData[slug];
            console.log('cookie', cookie)
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
                <div class="cookie-image">
                    <div class="image-loading-container">
                        <div class="image-loading"></div>
                        <img src="${cookie.images.chewy}" alt="${cookie.title}" loading="lazy">
                    </div>
                    ${tagsHTML}
                    <button class="cookie-overlay-btn" onclick="event.stopPropagation(); openPopup('${slug}')">
                        <i class="fas fa-plus"></i> Add to Cart
                    </button>
                </div>
                <div class="cookie-details">
                    <h3>${cookie.title}</h3>
                    <div class="cookie-price">${cookie.chewy_price} LE</div>
                </div>
            `;

            // Setup image handlers for this cookie
            const img = cookieCard.querySelector('img');
            setupImageHandlers(img);

            cookiesGrid.appendChild(cookieCard);
        });

        console.log('Cookies grid rendered successfully:', Object.keys(cookiesData).length, 'cookies');
    } catch (error) {
        console.error('Error rendering cookies grid:', error);
        const cookiesGrid = document.querySelector('.cookies-grid');
        if (cookiesGrid) {
            cookiesGrid.innerHTML = '<div class="error-message">😢 Failed to load cookies. Please try refreshing the page.</div>';
        }
    }
}


// Individual image handler setup function
function setupImageHandlers(img) {
    if (!img) return;

    // Remove any existing handlers first
    img.onload = null;
    img.onerror = null;

    // Set loading state
    const container = img.closest('.image-loading-container');
    const loading = container ? container.querySelector('.image-loading') : null;

    img.onload = function() {
        console.log('Image loaded successfully:', img.src);
        if (loading) {
            loading.style.display = 'none';
        }
        // Remove handlers after successful load
        img.onload = null;
        img.onerror = null;
    };

    img.onerror = function() {
        console.warn('Image failed to load:', img.src);
        
        // Prevent multiple error handling
        if (img.hasAttribute('data-error-handled')) {
            return;
        }
        img.setAttribute('data-error-handled', 'true');

        // Set appropriate fallback image
        if (img.classList.contains('box-img') || img.closest('.box-image') || img.closest('.mystery-image')) {
            img.src = 'images/fallback-box.svg';
        } else {
            img.src = 'images/fallback-cookie.svg';
        }
        
        img.alt = 'Image not available';

        if (loading) {
            loading.style.display = 'none';
        }

        // Remove handlers after setting fallback
        img.onload = null;
        img.onerror = null;
    };

    // Add timeout for image loading (optional)
    setTimeout(() => {
        if (loading && loading.style.display !== 'none' && !img.complete) {
            console.log('Image loading timeout:', img.src);
            loading.style.display = 'none';
        }
    }, 5000); // 5 second timeout
}


// Mobile menu functionality
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mainNav = document.querySelector('.main-nav');

// Price service to handle database operations
const priceService = {
    
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

// Replace your existing setupMobileMenu function with this:
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav');
    const body = document.body;
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle mobile menu
            mainNav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
            
            // Toggle body scroll
            if (mainNav.classList.contains('active')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });

        // Close menu when clicking on nav links
        mainNav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                body.style.overflow = '';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mainNav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                body.style.overflow = '';
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                body.style.overflow = '';
            }
        });
    }
}

// Performance monitoring
const perfObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
        console.log(`${entry.name}: ${entry.duration}ms`);
    });
});

perfObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });

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

// Function to update loading progress
function updateLoadingProgress(increment = 20) {
    loadingProgress += increment;
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill && progressText) {
        progressFill.style.width = `${loadingProgress}%`;
        progressText.textContent = `${loadingProgress}%`;
    }
    
    // Hide loading screen when complete
    if (loadingProgress >= 100) {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 500);
    }
}




function openPopup(cookieType) {
    console.log('Opening popup for:', cookieType); // Debug
    console.log('Available cookies:', Object.keys(allCookiesData)); // Debug
    
    // disableBodyScroll();
    currentCookie = cookieType;
    currentStyle = 'chewy';
    quantity = 1;
    
    // Always use global data - change cookiesData to allCookiesData
    const cookie = allCookiesData[cookieType];
    
    if (!cookie) {
        console.error('Cookie not found in global data:', cookieType);
        console.error('Available cookies:', Object.keys(allCookiesData));
        showNotification('Cookie information not available');
        return;
    }
    
    // Update all popup content with dynamic data
    document.getElementById('popupTitle').textContent = cookie.title;
    document.getElementById('popupDescription').textContent = cookie.description;
    document.getElementById('popupImage').style.backgroundImage = `url(${cookie.images.chewy})`;
    
    // Update price based on current style
    const currentPrice = currentStyle === 'chewy' ? cookie.chewy_price : cookie.crumble_price;
    document.getElementById('popupPrice').textContent = `${currentPrice} LE`;
    
    // Update dynamic content - use fallback if data is missing
    document.getElementById('popupIngredients').textContent = cookie.ingredients || 'Premium ingredients carefully selected for the best flavor';
    document.getElementById('popupSpecialty').textContent = cookie.specialty || 'Handcrafted with care for exceptional taste and texture';
    document.getElementById('popupPerfectFor').textContent = cookie.perfectFor || 'Any occasion that calls for delicious homemade cookies';
    
    document.getElementById('quantityValue').textContent = quantity;
    
    // Set active style button
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

function changeStyle(style) {
    currentStyle = style;
    
    // Update style buttons
    document.querySelectorAll('.popup-style-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.popup-style-option[data-style="${style}"]`).classList.add('active');
    
    // Update image based on style - use allCookiesData
    if (currentCookie && allCookiesData[currentCookie]) {
        const cookie = allCookiesData[currentCookie];
        document.getElementById('popupImage').style.backgroundImage = `url(${cookie.images[style]})`;
        
        // Update price based on style
        const currentPrice = style === 'chewy' ? cookie.chewy_price : cookie.crumble_price;
        document.getElementById('popupPrice').textContent = `${currentPrice} LE`;
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

    // Use allCookiesData instead of cookiesData
    const cookie = allCookiesData[currentCookie];
    if (!cookie) {
        showNotification('Error: Cookie data not available');
        console.error('Cookie not found:', currentCookie);
        console.error('Available cookies:', Object.keys(allCookiesData));
        return;
    }

    // Get price from database instead of static data
    const cookiePrice = await getCookiePrice(currentCookie, currentStyle);
    if (!cookiePrice) {
        showNotification('Error: Could not verify price. Please try again.');
        return;
    }

    const unitPrice = cookiePrice;
    const qty = quantity || 1;
    const cookieName = cookie.title;
    
    const name = `${cookieName} (${currentStyle.charAt(0).toUpperCase() + currentStyle.slice(1)})`;

    // Build cart object with dynamic data
    const cart = getCart();
    cart.push({
        id: Date.now(),
        name: name,
        unitPrice: unitPrice,
        price: unitPrice * qty,
        img: cookie.images[currentStyle] || 'images/default_cookie.svg',
        quantity: qty,
        style: currentStyle,
        cookieType: currentCookie
    });

    saveCart(cart);
    updateCartUI();
    showNotification(`${name} added to cart!`);

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
    if (!box) {
        // Fallback to boxesData if not in currentPrices
        const boxData = boxesData.find(b => b.size === boxSize);
        if (!boxData) return null;
        
        return style === 'mix' ? boxData.mix_price : boxData[`${style}_price`];
    }
    
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
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
}


// Add to your image loading
        // --- EXPLORE US DROPDOWN MOBILE HANDLING ---
        const exploreDropdown = mainNav.querySelector('.dropdown');
        const dropdownToggle = exploreDropdown?.querySelector('.dropdown-toggle');
        const dropdownMenu = exploreDropdown?.querySelector('.dropdown-menu');
        if (exploreDropdown && dropdownToggle && dropdownMenu) {
            dropdownToggle.onclick = null;
            dropdownToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (window.innerWidth <= 992) {
                    dropdownMenu.classList.toggle('active');
                    document.addEventListener('click', function handler(ev) {
                        if (!dropdownMenu.contains(ev.target) && !dropdownToggle.contains(ev.target)) {
                            dropdownMenu.classList.remove('active');
                            document.removeEventListener('click', handler);
                        }
                    });
                }
            });
        }
        // --- END EXPLORE US DROPDOWN MOBILE HANDLING ---
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
        this.src = 'images/fallback-cookie.svg';
        this.alt = 'Cookie image not available';
    });
});


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
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
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


async function renderCookieShowcase() {
    const showcaseGrid = document.getElementById('cookie-showcase-grid');
    if (!showcaseGrid) return;

    // Show loading state
    showcaseGrid.innerHTML = '<div class="loading-cookies">🍪 Loading our delicious cookies...</div>';

    try {
        // Ensure we have cookies data
        if (Object.keys(allCookiesData).length === 0) {
            await fetchCookiesData();
        }
        
        const cookieSlugs = Object.keys(allCookiesData);
        const shuffledSlugs = shuffleArray([...cookieSlugs]);
        const featuredCookies = shuffledSlugs.slice(0, 4);
        
        showcaseGrid.innerHTML = '';
        console.log('Rendering showcase with cookies:', featuredCookies);
        
        featuredCookies.forEach(slug => {
            const cookie = allCookiesData[slug];
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
                <div class="cookie-image">
                    <div class="image-loading-container">
                        <div class="image-loading"></div>
                        <img src="${cookie.images.chewy}" alt="${cookie.title}" loading="lazy">
                    </div>
                    ${tagsHTML}
                    <button class="cookie-overlay-btn" onclick="event.stopPropagation(); openPopup('${slug}')">
                        <i class="fas fa-plus"></i> Add to Cart
                    </button>
                </div>
                <div class="cookie-details">
                    <h3>${cookie.title}</h3>
                    <div class="cookie-price">${cookie.chewy_price} LE</div>
                </div>
            `;

            // Setup image handlers for this cookie
            const img = cookieCard.querySelector('img');
            setupImageHandlers(img);

            showcaseGrid.appendChild(cookieCard);
        });

        console.log('Cookie showcase rendered successfully:', featuredCookies.length, 'cookies');
    } catch (error) {
        console.error('Error rendering cookie showcase:', error);
        showcaseGrid.innerHTML = '<div class="error-message">😢 Failed to load cookies. Please try refreshing the page.</div>';
    }
}

// Function to open popup from home tab showcase
function openPopupFromHome(cookieType) {
    console.log('Opening popup from home for:', cookieType);
    openPopup(cookieType); // Use the same popup function
}

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Test function - run this in browser console
function testHomePopup() {
    const showcaseButtons = document.querySelectorAll('.showcase-add-btn');
    if (showcaseButtons.length > 0) {
        const firstButton = showcaseButtons[0];
        const slug = firstButton.getAttribute('data-cookie-slug');
        if (slug) {
            console.log('Testing popup with slug:', slug);
            openPopup(slug);
        } else {
            console.log('No slug found on button');
        }
    } else {
        console.log('No showcase buttons found');
    }
}

// عدل الـ switchTab function عشان متفتحش أي تاب لـ Explore Us
function switchTab(tabId) {
    // إذا التاب مش موجود، ما تعملش أي حاجة
    const activeTab = document.getElementById(`${tabId}-tab`);
    if (!activeTab) return;
    
    // كمل الكود العادي...
    enableBodyScroll();
    
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
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Scroll to top
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Close mobile menu if open
    if (window.innerWidth <= 768) {
        const mainNav = document.getElementById('main-nav');
        if (mainNav && mainNav.classList.contains('active')) {
            mainNav.classList.remove('active');
        }
    }
}

// في الـ event listeners بتاعت الـ navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        // تأكد إن الـ link ده مش الـ Explore Us
        if (this.classList.contains('dropdown-toggle')) {
            e.preventDefault();
            return;
        }
        
        const tabId = this.getAttribute('data-tab');
        switchTab(tabId);
    });
});
// Function to render box showcase
async function renderBoxShowcase() {
    const showcaseGrid = document.getElementById('box-showcase-grid');
    if (!showcaseGrid) return;

    // Show loading state
    showcaseGrid.innerHTML = '<div class="loading-boxes">📦 Loading our amazing boxes...</div>';

    try {
        // Ensure we have boxes data
        if (boxesData.length === 0) {
            boxesData = await fetchBoxesData();
        }
        
        // Take first 4 boxes for showcase
        const featuredBoxes = boxesData.slice(0, 4);
        
        showcaseGrid.innerHTML = '';
        
        featuredBoxes.forEach((box, index) => {
            const boxCard = document.createElement('div');
            boxCard.className = 'showcase-box-card';
            boxCard.style.animationDelay = `${index * 0.2}s`;
            
            // Determine price display
            let priceDisplay = '';
            if (box.chewy_price === box.crumble_price) {
                priceDisplay = `${box.chewy_price} LE`;
            } else {
                const minPrice = Math.min(box.chewy_price, box.crumble_price);
                const maxPrice = Math.max(box.chewy_price, box.crumble_price);
                priceDisplay = `${minPrice} - ${maxPrice} LE`;
            }
            
            boxCard.innerHTML = `
                <div class="showcase-box-image">
                    <img src="${box.image_url}" alt="${box.name}" loading="lazy">
                </div>
                <div class="showcase-box-details">
                    <h3>${box.name}</h3>
                    <p>${box.description}</p>
                    <div class="showcase-box-price">${priceDisplay}</div>
                    <button class="showcase-box-btn" data-box-size="${box.size}">
                        <i class="fas fa-gift"></i> Customize Box
                    </button>
                </div>
            `;
            
            // Make entire card clickable
            boxCard.addEventListener('click', function(e) {
                // Don't trigger if the button was clicked (to avoid double events)
                if (!e.target.closest('.showcase-box-btn')) {
                    selectAndCustomizeBox(box.size);
                }
            });
            
            // Add button click event
            const button = boxCard.querySelector('.showcase-box-btn');
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card click event
                selectAndCustomizeBox(box.size);
            });
            
            showcaseGrid.appendChild(boxCard);
        });
        
    } catch (error) {
        console.error('Error rendering box showcase:', error);
        showcaseGrid.innerHTML = '<div class="error-message">😢 Unable to load our amazing boxes. Please try again later.</div>';
    }
}

// Function to handle box selection and customization
async function selectAndCustomizeBox(boxSize) {
    const boxElement = document.querySelector(`.box-option[data-size="${boxSize}"]`);
    if (boxElement) {
        selectedBox = boxElement;
        const boxData = boxesData.find(b => b.size === boxSize);
        
        if (boxData) {
            // Ensure cookies data is loaded before showing popup
            await ensureCookiesDataLoaded();
            showFlavorPopup(boxSize, boxData.cookie_count, boxElement);
        }
    }
}

// Function to initialize box showcase
function initBoxShowcase() {
    const showMoreBtn = document.getElementById('showMoreBoxesBtn');
    
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function() {
            console.log('Explore All Boxes clicked - switching to boxes tab');
            // Switch to boxes tab
            switchTab('boxes');
        });
    }
}

// Function to ensure cookies data is loaded
async function ensureCookiesDataLoaded() {
    if (Object.keys(allCookiesData).length === 0) {
        console.log('Loading cookies data for flavor selection...');
        await fetchCookiesData();
    }
    return allCookiesData;
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
    
    disableBodyScroll();
    
    // Reset selected flavors
    selectedFlavors = {};
    
    // Get box details from boxesData
    const box = boxesData.find(b => b.size === size);
    if (!box) {
        console.error('Box not found:', size);
        showNotification('Box information not available');
        return;
    }
    
    const sizeName = box.name;
    const description = box.description;
    let price = 0;
    
    // Get price based on selected style
    if (selectedStyle === 'mix') {
        price = box.mix_price;
    } else {
        price = box[`${selectedStyle}_price`];
    }
    
    // Update popup content
    popupTitle.textContent = `Customize Your ${sizeName}`;
    popupBoxName.textContent = sizeName;
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
    
    // Create flavor options dynamically from allCookiesData (FIXED)
    const flavors = [];
    
    // Generate flavors from dynamic cookies data - use allCookiesData instead of cookiesData
    Object.keys(allCookiesData).forEach(slug => {
        const cookie = allCookiesData[slug]; // Use allCookiesData here
        if (selectedStyle === 'mix') {
            // Add both chewy and crumble options for mix
            flavors.push({ 
                id: `flavor-${slug}-chewy`, 
                name: cookie.title, 
                type: 'chewy', 
                price: cookie.chewy_price,
                slug: slug
            });
            flavors.push({ 
                id: `flavor-${slug}-crumble`, 
                name: cookie.title, 
                type: 'crumble', 
                price: cookie.crumble_price,
                slug: slug
            });
        } else {
            // Add only the selected style
            flavors.push({ 
                id: `flavor-${slug}-${selectedStyle}`, 
                name: cookie.title, 
                type: selectedStyle, 
                price: selectedStyle === 'chewy' ? cookie.chewy_price : cookie.crumble_price,
                slug: slug
            });
        }
    });

    // Create flavor options with quantity selectors
    flavorGrid.innerHTML = '';
    
    flavors.forEach(flavor => {
        const uniqueId = `${flavor.id}-${flavor.type}`;
        selectedFlavors[uniqueId] = 0; // Initialize with 0 selected
        
        const flavorOption = document.createElement('div');
        flavorOption.className = 'flavor-option';
        flavorOption.setAttribute('data-id', uniqueId);
        flavorOption.setAttribute('data-slug', flavor.slug);
        flavorOption.setAttribute('data-type', flavor.type);
        flavorOption.innerHTML = `
            <div class="flavor-label">
                <div class="flavor-name">${flavor.name}</div>
                <div class="flavor-type">${flavor.type.charAt(0).toUpperCase() + flavor.type.slice(1)}</div>
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
                    
                    // Find the flavor from our flavors array
                    const flavor = flavors.find(f => `${f.id}-${f.type}` === id);
                    const flavorName = flavor ? flavor.name : 'Unknown Flavor';
                    const flavorType = flavor ? flavor.type : 'Unknown Type';
                    
                    flavorDiv.innerHTML = `
                        <span class="flavor-name">${flavorName}</span>
                        <span class="flavor-details">
                            <span class="flavor-type">${flavorType.charAt(0).toUpperCase() + flavorType.slice(1)}</span>
                            <span class="flavor-quantity">x${qty}</span>
                        </span>
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
            
            // Validate mix selection
            if (selectedStyle === 'mix') {
                const chewyCount = flavors.filter(f => f.type === 'chewy').reduce((sum, f) => sum + (selectedFlavors[`${f.id}-${f.type}`] || 0), 0);
                const crumbleCount = flavors.filter(f => f.type === 'crumble').reduce((sum, f) => sum + (selectedFlavors[`${f.id}-${f.type}`] || 0), 0);
                
                if (chewyCount === 0 || crumbleCount === 0) {
                    addButton.disabled = true;
                    addButton.style.opacity = '0.7';
                    selectedFlavorsSummary.innerHTML += '<p class="mix-warning">⚠️ Mix must include at least 1 Chewy and 1 Crumble cookie</p>';
                }
            }
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

async function initializeApp() {
    try {
        // Initialize Supabase
        await initializeSupabaseWithTimeout();
        updateLoadingProgress(20);
        
        // Fetch cookies data
        await fetchCookiesData();
        updateLoadingProgress(20);
        
        // Fetch boxes data
        await fetchBoxesData();
        updateLoadingProgress(20);
        
        // Fetch mystery box data
        await fetchMysteryBoxData();
        updateLoadingProgress(20);
        
        // Initialize prices
        currentPrices = await priceService.getCurrentPrices();
        updateLoadingProgress(20);
        
        // Render all components
        await renderAllComponents();
        
    } catch (error) {
        console.error('App initialization failed:', error);
        // Even if there's an error, hide the loading screen
        updateLoadingProgress(100);
        
        // Show error notification
        showNotification('Failed to load some content. Please refresh the page.');
    }
}

async function renderAllComponents() {
    try {
        // Render all components in sequence
        await renderCookiesGrid();
        await renderBoxes();
        await renderMysteryBox();
        await renderCookieShowcase();
        await renderBoxShowcase();
        
        // Initialize interactive elements
        initializeVSBattle();
        setupMobileMenu();
        initCookieShowcase();
        initBoxShowcase();
        
        // Update cart UI
        updateCartUI();
        
    } catch (error) {
        console.error('Error rendering components:', error);
        throw error;
    }
}
// Enhanced image error handling to prevent flashing
function setupImageErrorHandling() {
    // Handle image loading errors - prevent multiple triggers
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            const img = e.target;
            
            // Prevent infinite error loop by removing the onerror handler after first failure
            if (!img.hasAttribute('data-error-handled')) {
                img.setAttribute('data-error-handled', 'true');
                
                // Set fallback image based on context
                if (img.src.includes('cookie') || img.closest('.cookie-image')) {
                    img.src = 'images/fallback-cookie.svg';
                } else if (img.src.includes('box') || img.closest('.box-image') || img.closest('.mystery-image')) {
                    img.src = 'images/fallback-box.svg';
                } else {
                    img.src = 'images/fallback-image.svg';
                }
                
                img.alt = 'Image not available';
                
                // Hide loading state for this image
                const container = img.closest('.image-loading-container');
                if (container) {
                    const loading = container.querySelector('.image-loading');
                    if (loading) {
                        loading.style.display = 'none';
                    }
                }
                
                // Stop propagation to prevent multiple handlers
                e.stopImmediatePropagation();
            }
        }
    }, true);
    
    // Handle successful image loads
    document.addEventListener('load', function(e) {
        if (e.target.tagName === 'IMG') {
            const img = e.target;
            const container = img.closest('.image-loading-container');
            if (container) {
                const loading = container.querySelector('.image-loading');
                if (loading) {
                    loading.style.display = 'none';
                }
            }
        }
    }, true);
}

// Optional: Enhanced logo interaction
function setupLogoSection() {
    const logoSection = document.querySelector('.logo-section');
    const animatedLogo = document.querySelector('.animated-logo');
    
    if (logoSection && animatedLogo) {
        // Add scroll-based animation
        window.addEventListener('scroll', function() {
            const scrollPosition = window.scrollY;
            const sectionTop = logoSection.offsetTop;
            const sectionHeight = logoSection.offsetHeight;
            
            if (scrollPosition > sectionTop - window.innerHeight + 100 && 
                scrollPosition < sectionTop + sectionHeight) {
                const progress = (scrollPosition - (sectionTop - window.innerHeight + 100)) / 
                               (window.innerHeight + sectionHeight - 100);
                
                // Subtle scale effect based on scroll
                const scale = 1 + (progress * 0.1);
                animatedLogo.style.transform = `scale(${scale})`;
            }
        });
        
        // Click effect
        animatedLogo.addEventListener('click', function() {
            this.style.animation = 'logoPulse 0.5s ease';
            setTimeout(() => {
                this.style.animation = '';
            }, 500);
        });
        
        // Add CSS for click animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes logoPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}


function setupStoryTabs() {
    // Hide the story tabs navigation but keep it in DOM for functionality
    const storyTabsNav = document.querySelector('.story-tabs-nav');
    if (storyTabsNav) {
        storyTabsNav.style.display = 'none';
    }
    
    // Set default active tab
    const defaultPane = document.getElementById('our-story-pane');
    if (defaultPane) {
        defaultPane.classList.add('active');
    }
    
    // Add hover effects to cards
    const cards = document.querySelectorAll('.timeline-item, .founder-card, .vision-card, .promise-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// Updated dropdown functionality - Explore Us shows on click with arrow rotation
function setupDropdown() {
    const dropdownItems = document.querySelectorAll('.nav-item.dropdown');
    
    dropdownItems.forEach(item => {
        const toggle = item.querySelector('.dropdown-toggle');
        const menu = item.querySelector('.dropdown-menu');
        const arrow = item.querySelector('.dropdown-arrow');
        
        // Remove hover behavior and add click behavior
        if (window.innerWidth > 768) {
            // Remove hover behavior for desktop
            item.removeEventListener('mouseenter', handleMouseEnter);
            item.removeEventListener('mouseleave', handleMouseLeave);
            
            // Add click behavior for desktop
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other open dropdowns
                dropdownItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        const otherMenu = otherItem.querySelector('.dropdown-menu');
                        const otherArrow = otherItem.querySelector('.dropdown-arrow');
                        otherMenu.style.opacity = '0';
                        otherMenu.style.visibility = 'hidden';
                        otherMenu.style.transform = 'translateY(-10px)';
                        if (otherArrow) {
                            otherArrow.style.transform = 'rotate(0deg)';
                        }
                    }
                });
                
                // Toggle current dropdown
                if (menu.style.visibility === 'visible') {
                    menu.style.opacity = '0';
                    menu.style.visibility = 'hidden';
                    menu.style.transform = 'translateY(-10px)';
                    if (arrow) {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                } else {
                    menu.style.opacity = '1';
                    menu.style.visibility = 'visible';
                    menu.style.transform = 'translateY(0)';
                    if (arrow) {
                        arrow.style.transform = 'rotate(180deg)';
                    }
                }
            });
        }
        
        // Mobile behavior with arrow rotation
        if (window.innerWidth <= 768) {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                menu.classList.toggle('active');
                
                // Rotate arrow for mobile
                if (arrow) {
                    if (menu.classList.contains('active')) {
                        arrow.style.transform = 'rotate(180deg)';
                    } else {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                }
            });
        }
        
        // Handle dropdown link clicks
        const dropdownLinks = menu.querySelectorAll('.dropdown-link');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const storyTab = this.getAttribute('data-story-tab');
                
                console.log('Switching to story tab:', storyTab);
                
                // Switch to our-story tab first
                switchTab('our-story');
                
                // Then switch the story sub-tab
                setTimeout(() => {
                    switchStoryTab(storyTab);
                }, 100);
                
                // Close dropdown and reset arrow
                if (window.innerWidth <= 768) {
                    menu.classList.remove('active');
                    if (arrow) {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                } else {
                    menu.style.opacity = '0';
                    menu.style.visibility = 'hidden';
                    menu.style.transform = 'translateY(-10px)';
                    if (arrow) {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                }
            });
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-item.dropdown')) {
            dropdownItems.forEach(item => {
                const menu = item.querySelector('.dropdown-menu');
                const arrow = item.querySelector('.dropdown-arrow');
                if (window.innerWidth > 768) {
                    menu.style.opacity = '0';
                    menu.style.visibility = 'hidden';
                    menu.style.transform = 'translateY(-10px)';
                    if (arrow) {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                } else {
                    menu.classList.remove('active');
                    if (arrow) {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                }
            });
        }
    });
    
    // Close dropdown on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            dropdownItems.forEach(item => {
                const menu = item.querySelector('.dropdown-menu');
                const arrow = item.querySelector('.dropdown-arrow');
                if (window.innerWidth > 768) {
                    menu.style.opacity = '0';
                    menu.style.visibility = 'hidden';
                    menu.style.transform = 'translateY(-10px)';
                    if (arrow) {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                } else {
                    menu.classList.remove('active');
                    if (arrow) {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                }
            });
        }
    });
}

// Add these helper functions if they don't exist
function handleMouseEnter() {
    if (window.innerWidth > 768) {
        const menu = this.querySelector('.dropdown-menu');
        menu.style.opacity = '1';
        menu.style.visibility = 'visible';
        menu.style.transform = 'translateY(0)';
    }
}

function handleMouseLeave() {
    if (window.innerWidth > 768) {
        const menu = this.querySelector('.dropdown-menu');
        menu.style.opacity = '0';
        menu.style.visibility = 'hidden';
        menu.style.transform = 'translateY(-10px)';
    }
}


// Updated function to switch story tabs without scrolling
function switchStoryTab(tabId) {
    const storyTabPanes = document.querySelectorAll('.story-tab-pane');
    
    // Hide all story tab panes
    storyTabPanes.forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Show the selected story tab pane
    const targetPane = document.getElementById(`${tabId}-pane`);
    if (targetPane) {
        targetPane.classList.add('active');
        console.log('Activated story pane:', targetPane.id);
        
        // REMOVED THE SCROLLING BEHAVIOR - this keeps the page position
    } else {
        console.error('Story tab pane not found:', `${tabId}-pane`);
    }
}


// Enhanced mobile dropdown functionality
function setupMobileDropdown() {
    const dropdownItems = document.querySelectorAll('.nav-item.dropdown');
    
    dropdownItems.forEach(item => {
        const toggle = item.querySelector('.dropdown-toggle');
        const menu = item.querySelector('.dropdown-menu');
        const arrow = item.querySelector('.dropdown-arrow');
        
        // Mobile behavior
        if (window.innerWidth <= 768) {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close other open dropdowns
                dropdownItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        const otherMenu = otherItem.querySelector('.dropdown-menu');
                        const otherArrow = otherItem.querySelector('.dropdown-arrow');
                        otherMenu.classList.remove('active');
                        if (otherArrow) {
                            otherArrow.style.transform = 'rotate(0deg)';
                        }
                    }
                });
                
                // Toggle current dropdown
                menu.classList.toggle('active');
                
                // Rotate arrow
                if (arrow) {
                    if (menu.classList.contains('active')) {
                        arrow.style.transform = 'rotate(180deg)';
                    } else {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                }
            });
        }
        
        // Handle dropdown link clicks
        const dropdownLinks = menu.querySelectorAll('.dropdown-link');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const storyTab = this.getAttribute('data-story-tab');
                
                console.log('Switching to story tab:', storyTab);
                
                // Switch to our-story tab first
                switchTab('our-story');
                
                // Then switch the story sub-tab
                setTimeout(() => {
                    switchStoryTab(storyTab);
                }, 100);
                
                // Close dropdown and reset arrow
                if (window.innerWidth <= 768) {
                    menu.classList.remove('active');
                    if (arrow) {
                        arrow.style.transform = 'rotate(0deg)';
                    }
                    
                    // Close mobile menu
                    const mainNav = document.getElementById('main-nav');
                    if (mainNav) {
                        mainNav.classList.remove('active');
                    }
                }
            });
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-item.dropdown')) {
            dropdownItems.forEach(item => {
                const menu = item.querySelector('.dropdown-menu');
                const arrow = item.querySelector('.dropdown-arrow');
                menu.classList.remove('active');
                if (arrow) {
                    arrow.style.transform = 'rotate(0deg)';
                }
            });
        }
    });
}

// Mobile Navigation Functionality
function setupMobileNavigation() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const mobileDropdownToggles = document.querySelectorAll('.mobile-dropdown-toggle');
    
    if (mobileMenuBtn && mobileNav) {
        // Toggle mobile menu
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle mobile menu
            mobileNav.classList.toggle('active');
            mobileNavOverlay.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
            
            // Toggle body scroll
            if (mobileNav.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking on overlay
        mobileNavOverlay.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Close menu when clicking on nav links
        mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                if (!this.classList.contains('mobile-dropdown-toggle')) {
                    mobileNav.classList.remove('active');
                    mobileNavOverlay.classList.remove('active');
                    mobileMenuBtn.classList.remove('active');
                    document.body.style.overflow = '';
                    
                    // Switch tab if it's a regular link
                    const tabId = this.getAttribute('data-tab');
                    if (tabId) {
                        switchTab(tabId);
                    }
                }
            });
        });
        
        // Mobile dropdown functionality
        mobileDropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const dropdownMenu = this.nextElementSibling;
                const dropdownArrow = this.querySelector('.mobile-dropdown-arrow');
                
                // Toggle dropdown
                dropdownMenu.classList.toggle('active');
                
                // Rotate arrow
                if (dropdownArrow) {
                    dropdownArrow.style.transform = dropdownMenu.classList.contains('active') 
                        ? 'rotate(180deg)' 
                        : 'rotate(0deg)';
                }
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.mobile-dropdown')) {
                document.querySelectorAll('.mobile-dropdown-menu').forEach(menu => {
                    menu.classList.remove('active');
                });
                document.querySelectorAll('.mobile-dropdown-arrow').forEach(arrow => {
                    arrow.style.transform = 'rotate(0deg)';
                });
            }
        });
        
        // Handle story tab links in mobile dropdown
        document.querySelectorAll('.mobile-dropdown-link[data-story-tab]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const storyTab = this.getAttribute('data-story-tab');
                
                // Close mobile menu
                mobileNav.classList.remove('active');
                mobileNavOverlay.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                document.body.style.overflow = '';
                
                // Switch to our-story tab and then to the specific story tab
                switchTab('our-story');
                setTimeout(() => {
                    switchStoryTab(storyTab);
                }, 100);
            });
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                mobileNavOverlay.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Update the mobile menu button HTML in your header
function updateMobileMenuButton() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
    }
}

// Ensure cart works in mobile view
function setupMobileCart() {
    const cartIcon = document.getElementById('cart-icon');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCart = document.getElementById('close-cart');
    const cartOverlay = document.getElementById('cart-overlay');

    if (cartIcon && cartSidebar) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Close mobile menu if open
            const mobileNav = document.getElementById('mobile-nav');
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            if (mobileNav && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                document.getElementById('mobile-nav-overlay').classList.remove('active');
                document.body.style.overflow = '';
            }
            
            // Open cart
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        // Close cart functionality remains the same
        if (closeCart) {
            closeCart.addEventListener('click', function() {
                cartSidebar.classList.remove('active');
                cartOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        if (cartOverlay) {
            cartOverlay.addEventListener('click', function() {
                cartSidebar.classList.remove('active');
                cartOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    }
}

// Tab functionality
document.addEventListener('DOMContentLoaded', async function () {
    // Initialize Supabase first
    window.scrollTo(0, 0);
// Start with 0% progress
    updateLoadingProgress(0);
    setupImageErrorHandling();
    
    // Initialize Supabase and load data
    initializeApp();
document.body.style.overflow = 'hidden';
    setupLoadingTimeout();
    setupDropdown();
    setupMobileDropdown();
    setupMobileCart(); 

    // Fetch all cookies data FIRST, before rendering anything
    console.log('Fetching cookies data...'); // Debug
    // await fetchCookiesData();

    // Initialize prices
    currentPrices = await priceService.getCurrentPrices();
    console.log('Prices loaded successfully:', currentPrices);
   
    
    setupMobileMenu(); 
    updateMobileMenuButton();
    setupMobileNavigation();
    setupStoryTabs();
    
        setupLogoSection();
    
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
    // mobileMenuBtnn.addEventListener('click', openMobileNav);

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

    // Add this function to your JavaScript




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

    // In your DOMContentLoaded event, update the style selection to show dynamic prices
styleBtns.forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');

        selectedStyle = this.getAttribute('data-style');

        // Update box prices with ranges
        boxesData.forEach(box => {
            const boxElement = document.querySelector(`.box-option[data-size="${box.size}"]`);
            if (boxElement) {
                const priceDisplay = boxElement.querySelector('.price-display');
                
                if (selectedStyle === 'mix') {
                    // For mix, show the mix price
                    priceDisplay.textContent = `${box.mix_price} LE`;
                } else {
                    // For chewy/crumble, show range if prices are different
                    if (box.chewy_price === box.crumble_price) {
                        priceDisplay.textContent = `${box[`${selectedStyle}_price`]} LE`;
                    } else {
                        const minPrice = Math.min(box.chewy_price, box.crumble_price);
                        const maxPrice = Math.max(box.chewy_price, box.crumble_price);
                        priceDisplay.textContent = `${minPrice} - ${maxPrice} LE`;
                    }
                }
            }
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
            const size = selectedBox.getAttribute('data-size');
            const box = boxesData.find(b => b.size === size);
            
            if (box) {
                let price = 0;
                if (selectedStyle === 'mix') {
                    price = box.mix_price;
                } else {
                    price = box[`${selectedStyle}_price`];
                }
                
                document.getElementById('popup-box-price').textContent = `${price} LE`;
                document.getElementById('final-price').textContent = price;

                // Refresh flavor grid based on newly selected style
                showFlavorPopup(size, box.cookie_count, selectedBox);
            }
        }
    });
});



    // Get number of cookies based on box size
    // Replace the static getCookieCount function with dynamic version
function getCookieCount(size) {
    const box = boxesData.find(b => b.size === size);
    return box ? box.cookie_count : 2; // Default to 2 if not found
}

    

// Replace the box selection event in DOMContentLoaded
boxOptions.forEach(box => {
    box.addEventListener('click', async function () {
        selectedBox = this;
        const size = this.getAttribute('data-size');
        const boxData = boxesData.find(b => b.size === size);
        
        if (boxData) {
            // Ensure cookies data is loaded before showing popup
            await ensureCookiesDataLoaded();
            showFlavorPopup(size, boxData.cookie_count, this);
        }
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
            console.log("selectedFlavors", selectedFlavors)
            const chewyCount = selectedFlavors.filter(f => f.type.toLowerCase() === 'chewy').reduce((s, f) => s + f.quantity, 0);
            const crumbleCount = selectedFlavors.filter(f => f.type.toLowerCase() === 'crumble').reduce((s, f) => s + f.quantity, 0);
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
