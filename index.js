

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
// Global variables for detail page
let currentDetailCookie = null;
let currentDetailStyle = 'chewy';


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
// document.addEventListener('DOMContentLoaded', function() {
//     setupMobileMenu();
// });

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

// Enhanced Cookie Slider Functionality
let currentSlide = 0;
let totalSlides = 0;
let autoSlideInterval;
let sliderTouchStartX = 0;
let sliderTouchEndX = 0;

// Initialize cookie slider
function initCookieSlider() {
    renderCookieSlider();
    setupSliderControls();
    startAutoSlide();
}

// Render cookie slider with dynamic data
async function renderCookieSlider() {
    const slider = document.getElementById('cookie-slider');
    const dotsContainer = document.getElementById('sliderDots');
    const totalSlidesElement = document.getElementById('totalSlides');
    
    if (!slider) return;
    
    // Show loading state
    slider.innerHTML = `
        <div class="slider-loading">
            Loading our delicious cookies...
        </div>
    `;
    
    try {
        // Ensure we have cookies data
        if (Object.keys(allCookiesData).length === 0) {
            await fetchCookiesData();
        }
        
        const cookieSlugs = Object.keys(allCookiesData);
        const shuffledSlugs = shuffleArray([...cookieSlugs]);
        const featuredCookies = shuffledSlugs.slice(0, 4);
        
        slider.innerHTML = '';
        dotsContainer.innerHTML = '';
        
        totalSlides = featuredCookies.length;
        if (totalSlidesElement) {
            totalSlidesElement.textContent = totalSlides;
        }
        
        featuredCookies.forEach((slug, index) => {
            const cookie = allCookiesData[slug];
            
            // Create slide element
            const slide = document.createElement('div');
            slide.className = 'cookie-slide';
            slide.setAttribute('data-slide-index', index);
            
            // Get price information
            const priceInfo = getCookieDisplayPrice(cookie, 'chewy');
            
            // Generate features based on cookie data
            const featuresHTML = generateCookieFeatures(cookie);
            
            slide.innerHTML = `
                <div class="cookie-slide-image">
                    <div class="image-loading-container">
                        <div class="image-loading"></div>
                        <img src="${cookie.images.chewy}" alt="${cookie.title}" loading="lazy">
                    </div>
                    ${cookie.is_on_sale ? '<div class="cookie-slide-badge">On Sale</div>' : ''}
                </div>
                <div class="cookie-slide-content">
                    <h3 class="cookie-slide-title">${cookie.title}</h3>
                    <p class="cookie-slide-description">${cookie.description}</p>
                    
                    ${featuresHTML}
                    
                    <div class="cookie-slide-price">
                        ${priceInfo.displayHTML}
                    </div>
                    
                    <div class="cookie-slide-actions">
                        <button class="slider-add-btn" data-cookie-slug="${slug}">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="slider-detail-btn" data-cookie-slug="${slug}">
                            <i class="fas fa-info-circle"></i> View Details
                        </button>
                    </div>
                </div>
            `;
            
            // Setup image handlers
            const img = slide.querySelector('img');
            setupImageHandlers(img);
            
            slider.appendChild(slide);
            
            // Create dot for this slide
            const dot = document.createElement('div');
            dot.className = 'slider-dot';
            dot.setAttribute('data-slide-index', index);
            if (index === 0) dot.classList.add('active');
            
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
        
        // Update slider position
        updateSliderPosition();
        
        console.log('Enhanced cookie slider rendered successfully:', featuredCookies.length, 'slides');
        
    } catch (error) {
        console.error('Error rendering cookie slider:', error);
        slider.innerHTML = '<div class="error-message">😢 Failed to load cookies. Please try refreshing the page.</div>';
    }
}

// Generate features HTML based on cookie data
function generateCookieFeatures(cookie) {
    const features = [];
    console.log('Generating features for cookie:', cookie);
    
    // Add specialty feature
    if (cookie.specialty) {
        features.push(`
            <div class="cookie-feature">
                <i class="fas fa-star"></i>
                <span>${cookie.specialty}</span>
            </div>
        `);
    }
    
    // Add perfect for feature
    if (cookie.perfectFor) {
        features.push(`
            <div class="cookie-feature">
                <i class="fas fa-heart"></i>
                <span>${cookie.perfectFor}</span>
            </div>
        `);
    }
    
    // Add tags as features
    if (cookie.tags && cookie.tags.length > 0) {
        cookie.tags.slice(0, 2).forEach(tag => {
            features.push(`
                <div class="cookie-feature">
                    <i class="fas fa-tag"></i>
                    <span>${tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
                </div>
            `);
        });
    }
    
    return features.length > 0 ? `
        <div class="cookie-slide-features">
            ${features.join('')}
        </div>
    ` : '';
}

// Setup slider controls
function setupSliderControls() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateSlider(-1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateSlider(1));
    }
    
    // Add event listeners for buttons in slider
    document.addEventListener('click', function(e) {
        // Add to cart button
        if (e.target.classList.contains('slider-add-btn') || e.target.closest('.slider-add-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.classList.contains('slider-add-btn') ? 
                e.target : e.target.closest('.slider-add-btn');
            const slug = button.getAttribute('data-cookie-slug');
            
            if (slug) {
                console.log('Slider add button clicked:', slug);
                openPopup(slug);
                
                // Add visual feedback
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> Added!';
                button.style.background = 'linear-gradient(135deg, #2e8b57, #1f6e42)';
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.style.background = 'linear-gradient(135deg, #8b5a2b, #6d4520)';
                }, 1500);
            }
        }
        
        // View details button
        if (e.target.classList.contains('slider-detail-btn') || e.target.closest('.slider-detail-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.classList.contains('slider-detail-btn') ? 
                e.target : e.target.closest('.slider-detail-btn');
            const slug = button.getAttribute('data-cookie-slug');
            
            if (slug) {
                console.log('Slider detail button clicked:', slug);
                openPopup(slug);
            }
        }
    });
    
    // Pause auto-slide on hover
    const sliderContainer = document.querySelector('.cookie-slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', pauseAutoSlide);
        sliderContainer.addEventListener('mouseleave', startAutoSlide);
    }
    
    // Enhanced touch support
    setupEnhancedTouchSupport();
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            navigateSlider(-1);
        } else if (e.key === 'ArrowRight') {
            navigateSlider(1);
        }
    });
}

// Enhanced touch support with swipe detection
function setupEnhancedTouchSupport() {
    const sliderTrack = document.querySelector('.cookie-slider-track');
    if (!sliderTrack) return;
    
    sliderTrack.addEventListener('touchstart', (e) => {
        sliderTouchStartX = e.touches[0].clientX;
        pauseAutoSlide();
    }, { passive: true });
    
    sliderTrack.addEventListener('touchmove', (e) => {
        sliderTouchEndX = e.touches[0].clientX;
    }, { passive: true });
    
    sliderTrack.addEventListener('touchend', () => {
        const diff = sliderTouchStartX - sliderTouchEndX;
        const threshold = 50;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe left - next slide
                navigateSlider(1);
            } else {
                // Swipe right - previous slide
                navigateSlider(-1);
            }
        }
        
        startAutoSlide();
    }, { passive: true });
}

// Navigate slider
function navigateSlider(direction) {
    const newIndex = currentSlide + direction;
    
    if (newIndex >= 0 && newIndex < totalSlides) {
        currentSlide = newIndex;
        updateSliderPosition();
    } else if (newIndex < 0) {
        // Loop to last slide
        currentSlide = totalSlides - 1;
        updateSliderPosition();
    } else if (newIndex >= totalSlides) {
        // Loop to first slide
        currentSlide = 0;
        updateSliderPosition();
    }
}

// Go to specific slide
function goToSlide(index) {
    if (index >= 0 && index < totalSlides) {
        currentSlide = index;
        updateSliderPosition();
    }
}

// Update slider position and active states
function updateSliderPosition() {
    const slider = document.getElementById('cookie-slider');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentSlideElement = document.getElementById('currentSlide');
    
    if (slider) {
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    
    // Update active dot
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
    
    // Update button states
    if (prevBtn) {
        prevBtn.disabled = currentSlide === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentSlide === totalSlides - 1;
    }
    
    // Update counter
    if (currentSlideElement) {
        currentSlideElement.textContent = currentSlide + 1;
    }
}

// Auto-slide functionality
function startAutoSlide() {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
    
    autoSlideInterval = setInterval(() => {
        const nextSlide = (currentSlide + 1) % totalSlides;
        goToSlide(nextSlide);
    }, 5000); // Change slide every 5 seconds
}

function pauseAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

// Update your existing initCookieShowcase function
function initCookieShowcase() {
    const showMoreBtn = document.getElementById('showMoreCookiesBtn');
    
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function() {
            console.log('Explore All Cookies clicked - switching to cookies tab');
            switchTab('cookies');
        });
    }
    
    // Initialize the enhanced slider
    initCookieSlider();
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

// Call this function when your app initializes
// Add this to your initializeApp function or DOMContentLoaded event
// initCookieSlider();

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
        supabaseInitialized = initializeSupabase();
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


function formatPriceWithSale(originalTotal, finalTotal, isOnSale) {
    if (!isOnSale || originalTotal === finalTotal) {
        return `<div class="cookie-price">${originalTotal} LE</div>`;
    }
    
    return `
        <div class="cookie-price-sale">
            <span class="original-price">${originalTotal} LE</span>
            <span class="final-price">${finalTotal} LE</span>
        </div>
    `;
}

function getCookieDisplayPrice(cookie, style = 'chewy', quantity = 1) {
    const isOnSale = cookie.is_on_sale && 
        ((style === 'chewy' && cookie.chewy_discount_rate > 0) || 
         (style === 'crumble' && cookie.crumble_discount_rate > 0));
    
    const originalPrice = style === 'chewy' ? cookie.chewy_price : cookie.crumble_price;
    const finalPrice = style === 'chewy' ? cookie.chewy_final_price : cookie.crumble_final_price;
    
    const totalOriginal = originalPrice * quantity;
    const totalFinal = finalPrice * quantity;
    
    return {
        originalPrice,
        finalPrice,
        isOnSale,
        totalOriginal,
        totalFinal,
        displayHTML: formatPriceWithSale(totalOriginal, totalFinal, isOnSale)
    };
}

// Fixed fetchCookiesData function
async function fetchCookiesData() {
    try {
        console.log('Starting to fetch cookies data...');
        
        const initialized = await ensureSupabaseInitialized();
        if (!initialized) {
            console.warn('Supabase not initialized, using fallback data');
            allCookiesData = getFallbackCookiesData();
            console.log('Using fallback data:', Object.keys(allCookiesData));
            return allCookiesData;
        }

        console.log('Fetching from Supabase...');
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

        console.log('Raw data from Supabase:', data);

        // Transform the data properly
        const transformedData = {};
        
        if (data && data.length > 0) {
            data.forEach(cookie => {
                transformedData[cookie.slug] = {
                    title: cookie.name,
                    description: cookie.description,
                    images: {
                        chewy: cookie.image_url_chewy || 'images/fallback-cookie.svg',
                        crumble: cookie.image_url_crumble || 'images/fallback-cookie.svg'
                    },
                    price: `${cookie.chewy_price} LE`,
                    ingredients: cookie.ingredients || 'Premium ingredients carefully selected for the best flavor',
                    specialty: cookie.specialty || 'Handcrafted with care for exceptional taste and texture',
                    perfectFor: cookie.perfect_for || 'Any occasion that calls for delicious homemade cookies',
                    tags: cookie.tags || [],
                    chewy_price: cookie.chewy_price,
                    crumble_price: cookie.crumble_price,
                    // Add sale information
                    is_on_sale: cookie.is_on_sale || false,
                    chewy_discount_rate: cookie.chewy_discount_rate || 0,
                    crumble_discount_rate: cookie.crumble_discount_rate || 0,
                    chewy_discount_amount: cookie.chewy_discount_amount || 0,
                    crumble_discount_amount: cookie.crumble_discount_amount || 0,
                    chewy_final_price: cookie.chewy_final_price || cookie.chewy_price,
                    crumble_final_price: cookie.crumble_final_price || cookie.crumble_price
                };
            });
        } else {
            console.warn('No cookies data returned from Supabase');
        }

        allCookiesData = transformedData;
        console.log('Transformed cookies data:', allCookiesData);
        console.log('Total cookies loaded:', Object.keys(allCookiesData).length);
        
        return allCookiesData;
    } catch (error) {
        console.error('Error in fetchCookiesData:', error);
        allCookiesData = getFallbackCookiesData();
        return allCookiesData;
    }
}

// Keep your fallback function as backup
// function getFallbackCookiesData() {
//     return {
//         'chocolate-chip': {
//             title: 'The Original Chocolate Chips',
//             description: 'Classic chocolate chip cookie with premium Belgian chocolate',
//             images: {
//                 chewy: 'images/original_chewy_cookie.svg',
//                 crumble: 'images/original_crumble_cookie.svg'
//             },
//             price: '80 LE',
//             ingredients: 'Flour, Belgian chocolate chunks, butter, brown sugar, eggs, vanilla extract, baking soda, salt',
//             specialty: 'Made with premium Belgian chocolate for a rich, authentic flavor',
//             perfectFor: 'Chocolate lovers, classic cookie enthusiasts, and family gatherings',
//             tags: ['popular'],
//             chewy_price: 80,
//             crumble_price: 80
//         },
//         // ... include all other cookies
//     };
// }

// Global variables for desktop detail
let desktopCurrentCookie = null;
let desktopCurrentStyle = 'chewy';
let desktopQuantity = 1;

// Open desktop cookie detail
function openDesktopCookieDetail(cookieType) {
    if (window.innerWidth <= 768) {
        // Use mobile version for mobile
        openCookieDetail(cookieType);
        return;
    }
    
    console.log('Opening desktop detail for:', cookieType);
    desktopCurrentCookie = cookieType;
    desktopCurrentStyle = 'chewy';
    desktopQuantity = 1;
    
    const cookie = allCookiesData[cookieType];
    
    if (!cookie) {
        console.error('Cookie not found:', cookieType);
        showNotification('Cookie information not available');
        return;
    }
    
    // Update desktop detail content
    document.getElementById('desktop-detail-title').textContent = cookie.title;
    document.getElementById('desktop-detail-description').textContent = cookie.description;
    
    // Update image
    const imageElement = document.getElementById('desktop-detail-image');
    const placeholder = document.getElementById('desktop-image-placeholder');
    
    if (cookie.images && cookie.images.chewy) {
        imageElement.style.backgroundImage = `url(${cookie.images.chewy})`;
        imageElement.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        imageElement.style.display = 'none';
        placeholder.style.display = 'flex';
    }
    
    // Update specifications
    document.getElementById('desktop-detail-ingredients').textContent = 
        cookie.ingredients || 'Premium ingredients carefully selected for the best flavor';
    document.getElementById('desktop-detail-specialty').textContent = 
        cookie.specialty || 'Handcrafted with care for exceptional taste and texture';
    document.getElementById('desktop-detail-perfect-for').textContent = 
        cookie.perfectFor || 'Any occasion that calls for delicious homemade cookies';
    
    // Update price with sale information
    updateDesktopPrice(cookie, 'chewy');
    
    // Reset and update UI
    document.getElementById('desktop-quantity-value').textContent = desktopQuantity;
    updateDesktopStyleButtons('chewy');
    
    // Show desktop detail
    document.getElementById('desktop-cookie-detail').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Update desktop price display
function updateDesktopPrice(cookie, style) {
    const priceInfo = getCookieDisplayPrice(cookie, style);
    const priceContainer = document.getElementById('desktop-price-container');
    
    // Clear existing content
    priceContainer.innerHTML = '';
    
    if (priceInfo.isOnSale && priceInfo.originalPrice !== priceInfo.finalPrice) {
        // Show sale price
        priceContainer.innerHTML = `
            <span class="desktop-original-price">${priceInfo.originalPrice} LE</span>
            <span class="desktop-final-price">${priceInfo.finalPrice} LE</span>
        `;
    } else {
        // Show regular price
        priceContainer.innerHTML = `<div class="desktop-price">${priceInfo.finalPrice} LE</div>`;
    }
}

// Update mobile popup quantity and price
function updatePopupQuantityAndPrice() {
    if (!currentCookie) return;
    
    const cookie = allCookiesData[currentCookie];
    if (!cookie) return;
    
    // Check if this specific style is on sale
    const isStyleOnSale = currentStyle === 'chewy' ? 
        (cookie.is_on_sale && cookie.chewy_discount_rate > 0) :
        (cookie.is_on_sale && cookie.crumble_discount_rate > 0);
    
    const unitPrice = currentStyle === 'chewy' ? cookie.chewy_price : cookie.crumble_price;
    const finalUnitPrice = currentStyle === 'chewy' ? cookie.chewy_final_price : cookie.crumble_final_price;
    
    const totalPrice = finalUnitPrice * quantity;
    const originalTotalPrice = unitPrice * quantity;
    
    // Update price display
    const priceContainer = document.getElementById('popupPrice');
    
    if (isStyleOnSale && unitPrice !== finalUnitPrice) {
        priceContainer.innerHTML = `
            <div class="cookie-price-sale">
                <span class="original-price">${originalTotalPrice} LE</span>
                <span class="final-price">${totalPrice} LE</span>
            </div>
        `;
    } else {
        priceContainer.innerHTML = `<div class="cookie-price">${totalPrice} LE</div>`;
    }
}

// Update desktop style change
function updateDesktopStyleButtons(style) {
    document.querySelectorAll('.desktop-style-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`desktop-style-${style}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    desktopCurrentStyle = style;
    
    // Update image if cookie is loaded
    if (desktopCurrentCookie && allCookiesData[desktopCurrentCookie]) {
        const cookie = allCookiesData[desktopCurrentCookie];
        const imageElement = document.getElementById('desktop-detail-image');
        
        if (cookie.images && cookie.images[style]) {
            imageElement.style.backgroundImage = `url(${cookie.images[style]})`;
            imageElement.style.display = 'block';
            document.getElementById('desktop-image-placeholder').style.display = 'none';
        }
        
        // Update price with current quantity and check style-specific sale
        updateDesktopQuantityAndPrice();
    }
}


// Close desktop detail
function closeDesktopCookieDetail() {
    document.getElementById('desktop-cookie-detail').classList.remove('active');
    document.body.style.overflow = 'auto';
    desktopCurrentCookie = null;
}

// Add to cart from desktop detail
async function addToCartFromDesktop() {
    const totalPrice = unitPrice * desktopQuantity;
    if (!desktopCurrentCookie) {
        showNotification('Error: No cookie selected');
        return;
    }

    const cookie = allCookiesData[desktopCurrentCookie];
    if (!cookie) {
        showNotification('Error: Cookie data not available');
        return;
    }

    // Get price based on current style and sale status
    let unitPrice;
    if (cookie.is_on_sale) {
        unitPrice = desktopCurrentStyle === 'chewy' ? cookie.chewy_final_price : cookie.crumble_final_price;
    } else {
        unitPrice = desktopCurrentStyle === 'chewy' ? cookie.chewy_price : cookie.crumble_price;
    }

    const qty = desktopQuantity || 1;
    const cookieName = cookie.title;
    
    const name = `${cookieName} (${desktopCurrentStyle.charAt(0).toUpperCase() + desktopCurrentStyle.slice(1)})`;

    const cart = getCart();
    cart.push({
        id: Date.now(),
        name: name,
        unitPrice: unitPrice,
        price: unitPrice * qty,
        img: cookie.images[desktopCurrentStyle] || 'images/default_cookie.svg',
        quantity: qty,
        style: desktopCurrentStyle,
        cookieType: desktopCurrentCookie,
        isOnSale: cookie.is_on_sale
    });

    saveCart(cart);
    updateCartUI();
    showNotification(`${name} added to cart!`);

    closeDesktopCookieDetail();
    
    // Reset quantity
    desktopQuantity = 1;
    document.getElementById('desktop-quantity-value').textContent = desktopQuantity;
}

// Update desktop quantity and price
function updateDesktopQuantityAndPrice() {
    if (!desktopCurrentCookie) return;
    
    const cookie = allCookiesData[desktopCurrentCookie];
    if (!cookie) return;
    
    // Check if this specific style is on sale
    const isStyleOnSale = desktopCurrentStyle === 'chewy' ? 
        (cookie.is_on_sale && cookie.chewy_discount_rate > 0) :
        (cookie.is_on_sale && cookie.crumble_discount_rate > 0);
    
    const unitPrice = desktopCurrentStyle === 'chewy' ? cookie.chewy_price : cookie.crumble_price;
    const finalUnitPrice = desktopCurrentStyle === 'chewy' ? cookie.chewy_final_price : cookie.crumble_final_price;
    
    const totalPrice = finalUnitPrice * desktopQuantity;
    const originalTotalPrice = unitPrice * desktopQuantity;
    
    // Update price display
    const priceContainer = document.getElementById('desktop-price-container');
    
    if (isStyleOnSale && unitPrice !== finalUnitPrice) {
        priceContainer.innerHTML = `
            <span class="desktop-original-price">${originalTotalPrice} LE</span>
            <span class="desktop-final-price">${totalPrice} LE</span>
        `;
    } else {
        priceContainer.innerHTML = `<div class="desktop-price">${totalPrice} LE</div>`;
    }
}

// Event listeners for desktop detail
function setupDesktopDetailEvents() {
    // Close button
    document.getElementById('desktop-close-btn').addEventListener('click', closeDesktopCookieDetail);
    
    // Style buttons
    document.querySelectorAll('.desktop-style-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const style = this.getAttribute('data-style');
            desktopCurrentStyle = style;
            updateDesktopStyleButtons(style);
        });
    });

    // Update desktop quantity buttons event listeners
document.getElementById('desktop-increase-qty').addEventListener('click', function() {
    desktopQuantity++;
    document.getElementById('desktop-quantity-value').textContent = desktopQuantity;
    updateDesktopQuantityAndPrice();
});

document.getElementById('desktop-decrease-qty').addEventListener('click', function() {
    if (desktopQuantity > 1) {
        desktopQuantity--;
        document.getElementById('desktop-quantity-value').textContent = desktopQuantity;
        updateDesktopQuantityAndPrice();
    }
});
    
    // Add to cart button
    document.getElementById('desktop-add-to-cart').addEventListener('click', addToCartFromDesktop);
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('desktop-cookie-detail').classList.contains('active')) {
            closeDesktopCookieDetail();
        }
    });
    
    // Close on overlay click (optional - if you want overlay clicking)
    document.getElementById('desktop-cookie-detail').addEventListener('click', function(e) {
        if (e.target === this) {
            closeDesktopCookieDetail();
        }
    });
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
            //setupImageHandlers(img);

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
                    <img src="${mysteryBoxData.image_url}" alt="Mystery Cookie Box" loading="lazy">
                </div>
            </div>

            <!-- Right Details -->
            <div class="mystery-details">
                <h3>🎁 Care the Mystery Box</h3>
                <p>At Sure's Crumble, we love surprises — and that's why we created the Mystery Box.</p>
                
                <p>Each box contains 6 cookies (Chewy, Crumble, or a mix). But here's the twist: hidden inside, you'll find 1–2 secret premium flavors that aren't on our regular menu.</p>
                
                <ul>
                    <li>🌟 <strong>Monthly Surprises:</strong> Every month, we bake something bold, new, and unexpected — flavors that keep you guessing and keep the experience exciting</li>
                    <li>🎯 <strong>Guess & Win:</strong> If you guess the secret flavor correctly, you win 15% off your next order!</li>
                    <li>🎁 <strong>More Than Cookies:</strong> It's more than just a cookie — it's a game, a challenge, and a sweet little adventure every time you order</li>
                </ul>
                
                <div class="mystery-price">${mysteryBoxData.price} LE</div>
                <p class="mystery-note">✨ So... are you brave enough to take the mystery bite?</p>
                <button class="btn mystery-btn">Take the Mystery Bite!</button>
                
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

                const name = "Care the Mystery Box"; // Updated name
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

                // Visual feedback - updated text
                this.textContent = "🎉 Mystery Box Added!";
                setTimeout(() => {
                    this.textContent = "Take the Mystery Bite!";
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

// Update the renderCookiesGrid function to create alternating layout
async function renderCookiesGrid() {
    console.log("Rendering cookies grid with alternating layout...");
    try {
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

        // Convert object to array and add index for alternating
        const cookiesArray = Object.keys(cookiesData).map((slug, index) => ({
            slug,
            cookie: cookiesData[slug],
            index
        }));

        cookiesArray.forEach(({ slug, cookie, index }) => {
            const isEven = index % 2 === 0; // Even index = left image, odd index = right image
            
            const cookieCard = document.createElement('div');
            cookieCard.className = `cookie-alternating-card ${isEven ? 'image-left' : 'image-right'}`;
            cookieCard.onclick = () => openPopup(slug);

            let tagsHTML = '';
            if (cookie.tags && cookie.tags.length > 0) {
                cookie.tags.forEach(tag => {
                    tagsHTML += `<div class="cookie-tag">${tag.charAt(0).toUpperCase() + tag.slice(1)}</div>`;
                });
            }

            // Get price display with sale information
            const priceInfo = getCookieDisplayPrice(cookie, 'chewy');

            // Create alternating layout HTML
            // Inside the cookieCard.innerHTML, update the button section:
cookieCard.innerHTML = `
    <div class="cookie-alternating-container">
        ${isEven ? `
            <!-- Image on LEFT, Content on RIGHT -->
            <div class="cookie-alternating-image">
                <div class="image-loading-container">
                    <div class="image-loading"></div>
                    <img src="${cookie.images.chewy}" alt="${cookie.title}" loading="lazy">
                </div>
                ${tagsHTML}
                ${cookie.is_on_sale ? '<div class="sale-ribbon">SALE</div>' : ''}
            </div>
            <div class="cookie-alternating-content">
                <h3>${cookie.title}</h3>
                <p class="cookie-description">${cookie.description}</p>
                <div class="cookie-features">
                    <div class="cookie-feature">
                        <i class="fas fa-leaf"></i>
                        <span>${cookie.ingredients || 'Premium ingredients'}</span>
                    </div>
                    <div class="cookie-feature">
                        <i class="fas fa-award"></i>
                        <span>${cookie.specialty || 'Handcrafted with care'}</span>
                    </div>
                </div>
                <div class="cookie-alternating-footer">
                    ${priceInfo.displayHTML}
                    <button class="choose-style-btn" onclick="event.stopPropagation(); openPopup('${slug}')">
                        <i class="fas fa-cookie-bite"></i> Choose Your Style
                    </button>
                </div>
            </div>
        ` : `
            <!-- Image on RIGHT, Content on LEFT -->
            <div class="cookie-alternating-content">
                <h3>${cookie.title}</h3>
                <p class="cookie-description">${cookie.description}</p>
                <div class="cookie-features">
                    <div class="cookie-feature">
                        <i class="fas fa-leaf"></i>
                        <span>${cookie.ingredients || 'Premium ingredients'}</span>
                    </div>
                    <div class="cookie-feature">
                        <i class="fas fa-award"></i>
                        <span>${cookie.specialty || 'Handcrafted with care'}</span>
                    </div>
                </div>
                <div class="cookie-alternating-footer">
                    ${priceInfo.displayHTML}
                    <button class="choose-style-btn" onclick="event.stopPropagation(); openPopup('${slug}')">
                        <i class="fas fa-cookie-bite"></i> Choose Your Style
                    </button>
                </div>
            </div>
            <div class="cookie-alternating-image">
                <div class="image-loading-container">
                    <div class="image-loading"></div>
                    <img src="${cookie.images.chewy}" alt="${cookie.title}" loading="lazy">
                </div>
                ${tagsHTML}
                ${cookie.is_on_sale ? '<div class="sale-ribbon">SALE</div>' : ''}
            </div>
        `}
    </div>
`;

            // Setup image handlers for this cookie
            const img = cookieCard.querySelector('img');
            setupImageHandlers(img);

            cookiesGrid.appendChild(cookieCard);
        });

        console.log('Alternating cookies grid rendered successfully:', Object.keys(cookiesData).length, 'cookies');
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
// Update the priceService.validateCart function to handle sale prices
const priceService = {
    async getCurrentPrices() {
        const initialized = await ensureSupabaseInitialized();
        if (!initialized) {
            return this.getFallbackPrices();
        }

        try {
            const [cookiesResponse, boxesResponse, mysteryResponse] = await Promise.all([
                supabase.from('cookies')
                    .select('slug, chewy_price, crumble_price, is_on_sale, chewy_final_price, crumble_final_price, chewy_discount_rate, crumble_discount_rate, chewy_discount_amount, crumble_discount_amount')
                    .eq('is_active', true),
                supabase.from('boxes')
                    .select('size, chewy_price, crumble_price, mix_price, cookie_count')
                    .eq('is_active', true),
                supabase.from('mystery_boxes')
                    .select('price')
                    .eq('is_active', true)
                    .single()
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
                { 
                    slug: 'chocolate-chip', 
                    chewy_price: 80, 
                    crumble_price: 80,
                    is_on_sale: false,
                    chewy_final_price: 80,
                    crumble_final_price: 80
                },
                { 
                    slug: 'chocolate-crispy', 
                    chewy_price: 90, 
                    crumble_price: 90,
                    is_on_sale: false,
                    chewy_final_price: 90,
                    crumble_final_price: 90
                },
                // ... include all other cookies with sale info
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

    // Validate cart items against current prices with sale support
    async validateCart(cartItems) {
        const currentPrices = await this.getCurrentPrices();
        const validItems = [];
        let total = 0;
        let hasChanges = false;
        let priceUpdates = [];

        for (const item of cartItems) {
            let isValid = false;
            let correctUnitPrice = 0;
            let priceChangeType = null;

            // Validate single cookies
            if (item.cookieType) {
                const cookiePrice = currentPrices.cookies.find(c => c.slug === item.cookieType);
                if (cookiePrice) {
                    // Check if cookie is on sale for the selected style
                    const styleKey = `${item.style}_price`;
                    const finalPriceKey = `${item.style}_final_price`;
                    
                    const originalPrice = cookiePrice[styleKey];
                    const finalPrice = cookiePrice[finalPriceKey];
                    const isOnSale = cookiePrice.is_on_sale;
                    
                    // Determine correct price (use final price if on sale, otherwise original price)
                    correctUnitPrice = isOnSale ? finalPrice : originalPrice;
                    
                    // Check if price matches
                    isValid = item.unitPrice === correctUnitPrice;
                    
                    // If price doesn't match, determine why
                    if (!isValid) {
                        if (isOnSale && item.unitPrice === originalPrice) {
                            // Item was purchased at original price but now it's on sale
                            priceChangeType = 'sale_applied';
                        } else if (!isOnSale && item.unitPrice === finalPrice && finalPrice !== originalPrice) {
                            // Item was purchased at sale price but sale ended
                            priceChangeType = 'sale_ended';
                        } else {
                            // Regular price change
                            priceChangeType = 'price_changed';
                        }
                    }
                }
            }
            // Validate boxes
            else if (item.size && item.size !== 'mystery') {
                const boxPrice = currentPrices.boxes.find(b => b.size === item.size);
                if (boxPrice) {
                    const priceKey = item.style === 'mix' ? 'mix_price' : `${item.style}_price`;
                    correctUnitPrice = boxPrice[priceKey];
                    isValid = item.unitPrice === correctUnitPrice;
                    if (!isValid) {
                        priceChangeType = 'price_changed';
                    }
                }
            }
            // Validate mystery box
            else if (item.size === 'mystery') {
                correctUnitPrice = currentPrices.mystery;
                isValid = item.unitPrice === correctUnitPrice;
                if (!isValid) {
                    priceChangeType = 'price_changed';
                }
            }

            if (isValid || correctUnitPrice > 0) {
                // Update price based on current quantity and correct unit price
                const newPrice = correctUnitPrice * item.quantity;
                const oldPrice = item.price;
                
                // Create updated item
                const updatedItem = {
                    ...item,
                    unitPrice: correctUnitPrice,
                    price: newPrice,
                    originalPrice: item.unitPrice, // Store old price for comparison
                    priceChangeType: priceChangeType
                };

                // Remove temporary fields if no change
                if (!priceChangeType) {
                    delete updatedItem.originalPrice;
                    delete updatedItem.priceChangeType;
                }

                validItems.push(updatedItem);
                total += newPrice;

                // Track if there were changes
                if (!isValid || oldPrice !== newPrice) {
                    hasChanges = true;
                    priceUpdates.push({
                        name: item.name,
                        oldPrice: oldPrice,
                        newPrice: newPrice,
                        changeType: priceChangeType || 'price_changed'
                    });
                }
            } else {
                hasChanges = true;
                console.warn('Invalid item removed from cart:', item);
            }
        }

        return { 
            validItems, 
            total, 
            hasChanges,
            priceUpdates 
        };
    },

    // Generate user-friendly message for price changes
    generatePriceUpdateMessage(priceUpdates) {
        if (priceUpdates.length === 0) return null;

        const messages = priceUpdates.map(update => {
            switch (update.changeType) {
                case 'sale_applied':
                    return `🎉 Sale applied to ${update.name}! Price reduced from ${update.oldPrice} to ${update.newPrice}`;
                case 'sale_ended':
                    return `📈 Sale ended for ${update.name}. Price updated from ${update.oldPrice} to ${update.newPrice}`;
                case 'price_changed':
                    return `💰 Price updated for ${update.name}: ${update.oldPrice} → ${update.newPrice}`;
                default:
                    return `💰 Price updated for ${update.name}: ${update.oldPrice} → ${update.newPrice}`;
            }
        });

        return messages.join('\n');
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




// Update your existing openPopup function to use desktop detail
function openPopup(cookieType) {
    if (window.innerWidth <= 768) {
        // Use mobile detail page for mobile
        openCookieDetail(cookieType);
    } else {
        // Use desktop detail for desktop
        openDesktopCookieDetail(cookieType);
    }
}


function openCookieDetail(cookieType) {
    console.log('Opening mobile detail page for:', cookieType);
    currentDetailCookie = cookieType;
    currentDetailStyle = 'chewy';
    
    const cookie = allCookiesData[cookieType];
    
    if (!cookie) {
        console.error('Cookie not found:', cookieType);
        showNotification('Cookie information not available');
        return;
    }
    
    // Get price information
    const priceInfo = getCookieDisplayPrice(cookie, currentDetailStyle);
    
    // Update detail page content
    document.getElementById('detail-title').textContent = cookie.title;
    document.getElementById('detail-description').textContent = cookie.description;
    document.getElementById('detail-image').style.backgroundImage = `url(${cookie.images.chewy})`;
    
    // Update price with sale information
    const priceContainer = document.getElementById('detail-price');
    priceContainer.innerHTML = priceInfo.displayHTML;
    
    document.getElementById('detail-ingredients').textContent = cookie.ingredients || 'Premium ingredients carefully selected for the best flavor';
    document.getElementById('detail-specialty').textContent = cookie.specialty || 'Handcrafted with care for exceptional taste and texture';
    document.getElementById('detail-perfect-for').textContent = cookie.perfectFor || 'Any occasion that calls for delicious homemade cookies';
    
    // Set active style button
    document.querySelectorAll('.cookie-detail-style-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.cookie-detail-style-btn[data-style="chewy"]').classList.add('active');
    
    // Show detail page
    document.getElementById('cookie-detail-page').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCookieDetail() {
    document.getElementById('cookie-detail-page').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentDetailCookie = null;
}

// Change style in mobile detail page
// Update mobile detail style change
function changeDetailStyle(style) {
    currentDetailStyle = style;
    
    document.querySelectorAll('.cookie-detail-style-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.cookie-detail-style-btn[data-style="${style}"]`).classList.add('active');
    
    if (currentDetailCookie && allCookiesData[currentDetailCookie]) {
        const cookie = allCookiesData[currentDetailCookie];
        document.getElementById('detail-image').style.backgroundImage = `url(${cookie.images[style]})`;
        
        // Update price with style-specific sale check
        const isStyleOnSale = style === 'chewy' ? 
            (cookie.is_on_sale && cookie.chewy_discount_rate > 0) :
            (cookie.is_on_sale && cookie.crumble_discount_rate > 0);
        
        const unitPrice = style === 'chewy' ? cookie.chewy_price : cookie.crumble_price;
        const finalPrice = style === 'chewy' ? cookie.chewy_final_price : cookie.crumble_final_price;
        
        const priceContainer = document.getElementById('detail-price');
        
        if (isStyleOnSale && unitPrice !== finalPrice) {
            priceContainer.innerHTML = `
                <div class="cookie-price-sale">
                    <span class="original-price">${unitPrice} LE</span>
                    <span class="final-price">${finalPrice} LE</span>
                </div>
            `;
        } else {
            priceContainer.innerHTML = `<div class="cookie-price">${unitPrice} LE</div>`;
        }
    }
}

async function addToCartFromDetail() {
    if (!currentDetailCookie) {
        showNotification('Error: No cookie selected');
        return;
    }

    const cookie = allCookiesData[currentDetailCookie];
    if (!cookie) {
        showNotification('Error: Cookie data not available');
        return;
    }

    const cookiePrice = await getCookiePrice(currentDetailCookie, currentDetailStyle);
    if (!cookiePrice) {
        showNotification('Error: Could not verify price. Please try again.');
        return;
    }

    const unitPrice = cookiePrice;
    const cookieName = cookie.title;
    
    const name = `${cookieName} (${currentDetailStyle.charAt(0).toUpperCase() + currentDetailStyle.slice(1)})`;

    const cart = getCart();
    cart.push({
        id: Date.now(),
        name: name,
        unitPrice: unitPrice,
        price: unitPrice,
        img: cookie.images[currentDetailStyle] || 'images/default_cookie.svg',
        quantity: 1,
        style: currentDetailStyle,
        cookieType: currentDetailCookie
    });

    saveCart(cart);
    updateCartUI();
    showNotification(`${name} added to cart!`);

    closeCookieDetail();
}

function openDesktopPopup(cookieType) {
    console.log('Opening desktop popup for:', cookieType);
    currentCookie = cookieType;
    currentStyle = 'chewy';
    quantity = 1;
    
    const cookie = allCookiesData[cookieType];
    
    if (!cookie) {
        console.error('Cookie not found:', cookieType);
        showNotification('Cookie information not available');
        return;
    }
    
    // Get price information based on current style
    const priceInfo = getCookieDisplayPrice(cookie, currentStyle);
    
    // Update popup content
    document.getElementById('popupTitle').textContent = cookie.title;
    document.getElementById('popupDescription').textContent = cookie.description;
    document.getElementById('popupImage').style.backgroundImage = `url(${cookie.images.chewy})`;
    
    // Update price with sale information
    const priceContainer = document.getElementById('popupPrice');
    priceContainer.innerHTML = priceInfo.displayHTML;
    
    document.getElementById('popupIngredients').textContent = cookie.ingredients || 'Premium ingredients carefully selected for the best flavor';
    document.getElementById('popupSpecialty').textContent = cookie.specialty || 'Handcrafted with care for exceptional taste and texture';
    document.getElementById('popupPerfectFor').textContent = cookie.perfectFor || 'Any occasion that calls for delicious homemade cookies';
    
    document.getElementById('quantityValue').textContent = quantity;
    
    document.querySelectorAll('.popup-style-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.popup-style-option[data-style="chewy"]').classList.add('active');
    
    document.getElementById('popupOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}


// Update existing closePopup function
function closePopup() {
    if (window.innerWidth <= 768) {
        closeCookieDetail();
    } else {
        document.getElementById('popupOverlay').classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Close popup when clicking outside of it
document.getElementById('popupOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closePopup();
    }
});

// For mobile detail page (if you add quantity)
function updateMobileDetailQuantityAndPrice() {
    if (!currentDetailCookie) return;
    
    const cookie = allCookiesData[currentDetailCookie];
    if (!cookie) return;
    
    // Get price based on current style and sale status
    let unitPrice;
    if (cookie.is_on_sale) {
        unitPrice = currentDetailStyle === 'chewy' ? cookie.chewy_final_price : cookie.crumble_final_price;
    } else {
        unitPrice = currentDetailStyle === 'chewy' ? cookie.chewy_price : cookie.crumble_price;
    }
    
    const totalPrice = unitPrice * (mobileDetailQuantity || 1);
    
    // Update price display
    const priceContainer = document.getElementById('detail-price');
    
    if (cookie.is_on_sale && cookie.chewy_price !== cookie.chewy_final_price) {
        const originalTotal = (currentDetailStyle === 'chewy' ? cookie.chewy_price : cookie.crumble_price) * (mobileDetailQuantity || 1);
        priceContainer.innerHTML = `
            <div class="cookie-price-sale">
                <span class="original-price">${originalTotal} LE</span>
                <span class="final-price">${totalPrice} LE</span>
            </div>
        `;
    } else {
        priceContainer.innerHTML = `<div class="cookie-price">${totalPrice} LE</div>`;
    }
}

function changeStyle(style) {
    currentStyle = style;
    
    // Update style buttons
    document.querySelectorAll('.popup-style-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.popup-style-option[data-style="${style}"]`).classList.add('active');
    
    // Update image based on style
    if (currentCookie && allCookiesData[currentCookie]) {
        const cookie = allCookiesData[currentCookie];
        document.getElementById('popupImage').style.backgroundImage = `url(${cookie.images[style]})`;
        
        // Update price with current quantity and check style-specific sale
        updatePopupQuantityAndPrice();
    }
}

// Update existing quantity functions for mobile popup
function increaseQuantity() {
    quantity++;
    document.getElementById('quantityValue').textContent = quantity;
    updatePopupQuantityAndPrice();
}

function decreaseQuantity() {
    if (quantity > 1) {
        quantity--;
        document.getElementById('quantityValue').textContent = quantity;
        updatePopupQuantityAndPrice();
    }
}

// Update addToCartFromPopup to use final prices
async function addToCartFromPopup() {
    const totalPrice = unitPrice * quantity;
    if (!currentCookie) {
        showNotification('Error: No cookie selected');
        return;
    }

    const cookie = allCookiesData[currentCookie];
    if (!cookie) {
        showNotification('Error: Cookie data not available');
        console.error('Cookie not found:', currentCookie);
        console.error('Available cookies:', Object.keys(allCookiesData));
        return;
    }

    // Use final price if on sale, otherwise use original price
    let cookiePrice;
    if (cookie.is_on_sale) {
        cookiePrice = currentStyle === 'chewy' ? cookie.chewy_final_price : cookie.crumble_final_price;
    } else {
        cookiePrice = currentStyle === 'chewy' ? cookie.chewy_price : cookie.crumble_price;
    }

    const unitPrice = cookiePrice;
    const qty = quantity || 1;
    const cookieName = cookie.title;
    
    const name = `${cookieName} (${currentStyle.charAt(0).toUpperCase() + currentStyle.slice(1)})`;

    const cart = getCart();
    cart.push({
        id: Date.now(),
        name: name,
        unitPrice: unitPrice,
        price: unitPrice * qty,
        img: cookie.images[currentStyle] || 'images/default_cookie.svg',
        quantity: qty,
        style: currentStyle,
        cookieType: currentCookie,
        isOnSale: cookie.is_on_sale // Store sale status for reference
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
// Update getCookiePrice to handle sale prices
async function getCookiePrice(cookieSlug, style) {
    if (!currentPrices) {
        currentPrices = await priceService.getCurrentPrices();
    }
    
    const cookie = currentPrices.cookies.find(c => c.slug === cookieSlug);
    if (!cookie) return null;
    
    // Return final price if on sale, otherwise original price
    if (cookie.is_on_sale) {
        const finalPriceKey = `${style}_final_price`;
        return cookie[finalPriceKey];
    } else {
        const priceKey = `${style}_price`;
        return cookie[priceKey];
    }
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

// Update cart UI with enhanced validation and sale support
async function updateCartUI() {
    const cart = getCart();
    
    // Validate cart against current prices with sale support
    const validation = await priceService.validateCart(cart);
    
    if (validation.hasChanges) {
        saveCart(validation.validItems);
        
        // Show detailed notification about price changes
        if (validation.priceUpdates && validation.priceUpdates.length > 0) {
            const message = priceService.generatePriceUpdateMessage(validation.priceUpdates);
            if (message) {
                showNotification(message, 4000); // Show for longer duration
            }
        } else {
            showNotification('Cart updated with current prices');
        }
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
            if (cartTotal) cartTotal.textContent = 'LE 0.00';
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

            // Check if this item had a price change
            const hasPriceChange = item.priceChangeType;
            const priceChangeClass = hasPriceChange ? 'price-updated' : '';
            const priceChangeIcon = hasPriceChange ? 
                (item.priceChangeType === 'sale_applied' ? '🎉' : 
                 item.priceChangeType === 'sale_ended' ? '📈' : '💰') : '';

            // Check if this specific item should show sale badge
            let saleBadgeHTML = '';
            if (item.cookieType && allCookiesData[item.cookieType]) {
                const cookie = allCookiesData[item.cookieType];
                const isStyleOnSale = item.style === 'chewy' ? 
                    (cookie.is_on_sale && cookie.chewy_discount_rate > 0) :
                    (cookie.is_on_sale && cookie.crumble_discount_rate > 0);
                
                if (isStyleOnSale) {
                    saleBadgeHTML = '<div class="cart-sale-badge">SALE</div>';
                }
            } else if (item.isOnSale) {
                // For boxes or mystery boxes that have sale status
                saleBadgeHTML = '<div class="cart-sale-badge">SALE</div>';
            }

            const cartItem = document.createElement('div');
            cartItem.className = `cart-item ${priceChangeClass}`;
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.img}" alt="${item.name}" onerror="this.src='images/fallback-cookie.svg'">
                    ${saleBadgeHTML}
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">
                        ${item.name}
                        ${hasPriceChange ? `<span class="price-change-indicator">${priceChangeIcon}</span>` : ''}
                    </div>
                    <div class="cart-item-price ${hasPriceChange ? 'price-updated' : ''}">
                        ${itemTotal} LE
                        ${hasPriceChange && item.originalPrice ? 
                            `<span class="original-cart-price">was ${item.originalPrice * item.quantity} LE</span>` : ''}
                    </div>
                    
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
        if (cartTotal) {
            cartTotal.textContent = `${total} LE`;
            
            // Show total savings if any items are on sale
            const saleItems = validatedCart.filter(item => {
                if (item.cookieType && allCookiesData[item.cookieType]) {
                    const cookie = allCookiesData[item.cookieType];
                    const isStyleOnSale = item.style === 'chewy' ? 
                        (cookie.is_on_sale && cookie.chewy_discount_rate > 0) :
                        (cookie.is_on_sale && cookie.crumble_discount_rate > 0);
                    return isStyleOnSale;
                }
                return item.isOnSale;
            });
            
            if (saleItems.length > 0) {
                const savings = saleItems.reduce((total, item) => {
                    if (item.cookieType && allCookiesData[item.cookieType]) {
                        const cookie = allCookiesData[item.cookieType];
                        const originalPrice = item.style === 'chewy' ? cookie.chewy_price : cookie.crumble_price;
                        const savingsPerItem = originalPrice - item.unitPrice;
                        return total + (savingsPerItem * item.quantity);
                    }
                    return total;
                }, 0);
                
                if (savings > 0) {
                    // Remove existing savings element if any
                    const existingSavings = document.querySelector('.cart-savings');
                    if (existingSavings) {
                        existingSavings.remove();
                    }
                    
                    const savingsElement = document.createElement('div');
                    savingsElement.className = 'cart-savings';
                    savingsElement.textContent = `You saved: ${savings} LE`;
                    cartTotal.parentNode.appendChild(savingsElement);
                }
            } else {
                // Remove savings element if no sale items
                const existingSavings = document.querySelector('.cart-savings');
                if (existingSavings) {
                    existingSavings.remove();
                }
            }
        }

        // Add event listeners to cart items
        document.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', async function () {
                const index = parseInt(this.getAttribute('data-index'));
                const cart = getCart();
                cart[index].quantity++;
                
                // Revalidate price with sale support
                const validation = await priceService.validateCart([cart[index]]);
                if (validation.validItems.length > 0) {
                    // Update the item with validated price
                    Object.assign(cart[index], validation.validItems[0]);
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
                    
                    // Revalidate price with sale support
                    const validation = await priceService.validateCart([cart[index]]);
                    if (validation.validItems.length > 0) {
                        // Update the item with validated price
                        Object.assign(cart[index], validation.validItems[0]);
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
        Promise.race([initializeSupabase(), timeoutPromise]);
        console.log('Supabase initialized successfully');
    } catch (error) {
        console.warn('Supabase initialization timed out, using fallback prices');
        // Use fallback prices immediately
        currentPrices = priceService.getFallbackPrices();
        supabaseInitialized = true;
    }
}


// Update renderCookieShowcase to show sale prices
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

            // Get price display with sale information
            const priceInfo = getCookieDisplayPrice(cookie, 'chewy');

            cookieCard.innerHTML = `
                <div class="cookie-image">
                    <div class="image-loading-container">
                        <div class="image-loading"></div>
                        <img src="${cookie.images.chewy}" alt="${cookie.title}" loading="lazy">
                    </div>
                    ${tagsHTML}
                    ${cookie.is_on_sale ? '<div class="sale-ribbon">SALE</div>' : ''}
                    <button class="cookie-overlay-btn" onclick="event.stopPropagation(); openPopup('${slug}')">
                        <i class="fas fa-plus"></i> Add to Cart
                    </button>
                </div>
                <div class="cookie-details">
                    <h3>${cookie.title}</h3>
                    ${priceInfo.displayHTML}
                </div>
            `;

            // Setup image handlers for this cookie
            const img = cookieCard.querySelector('img');
            //setupImageHandlers(img);

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
        console.log('Initializing app...');
        
        // Initialize Supabase first
        await initializeSupabase();
        updateLoadingProgress(20);
        console.log('Supabase initialized');
        
        // Fetch cookies data and WAIT for it to complete
        console.log('Fetching cookies data...');
        await fetchCookiesData();
        updateLoadingProgress(40);
        console.log('Cookies data loaded:', Object.keys(allCookiesData).length, 'cookies');
        
        // Fetch boxes data
        await fetchBoxesData();
        updateLoadingProgress(60);
        console.log('Boxes data loaded');
        
        // Fetch mystery box data
        await fetchMysteryBoxData();
        updateLoadingProgress(80);
        console.log('Mystery box data loaded');
        
        // Initialize prices
        currentPrices = await priceService.getCurrentPrices();
        updateLoadingProgress(90);
        console.log('Prices loaded');
        
        // Now render all components AFTER data is loaded
        await renderAllComponents();
        updateLoadingProgress(100);
        
        console.log('App initialization complete');
        
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
        console.log('Starting to render all components...');
        console.log('Available cookies data:', Object.keys(allCookiesData));
        
        // Render components in sequence and wait for each to complete
        await renderCookiesGrid();
        console.log('Cookies grid rendered');
        
        await renderBoxes();
        console.log('Boxes rendered');
        
        await renderMysteryBox();
        console.log('Mystery box rendered');
        
        await renderCookieShowcase();
        console.log('Cookie showcase rendered');
        
        await renderBoxShowcase();
        console.log('Box showcase rendered');
        
        // Initialize interactive elements
        initializeVSBattle();
        setupMobileMenu();
        initCookieShowcase();
        initBoxShowcase();
        
        // Update cart UI
        updateCartUI();
        
        console.log('All components rendered successfully');
        
    } catch (error) {
        console.error('Error rendering components:', error);
        throw error;
    }
}
// Add this function to debug the data flow
function debugCookiesData() {
    console.log('=== COOKIES DATA DEBUG ===');
    console.log('allCookiesData:', allCookiesData);
    console.log('Keys:', Object.keys(allCookiesData));
    console.log('Type:', typeof allCookiesData);
    console.log('Is empty:', Object.keys(allCookiesData).length === 0);
    
    // Check if we have fallback data
    if (Object.keys(allCookiesData).length === 0) {
        console.log('Using fallback data...');
        allCookiesData = getFallbackCookiesData();
        console.log('Fallback data keys:', Object.keys(allCookiesData));
    }
    
    // Force render cookies grid for testing
    renderCookiesGrid();
}

// Call this in your console if needed
// debugCookiesData();

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
// Add zoom functionality to cookie images
function initImageZoom() {
    const cookieImages = document.querySelectorAll('.cookie-image img, .cookie-slide-image img');
    
    cookieImages.forEach(img => {
        img.addEventListener('click', function() {
            this.classList.toggle('zoomed');
            if (this.classList.contains('zoomed')) {
                this.style.transform = 'scale(2)';
                this.style.cursor = 'zoom-out';
            } else {
                this.style.transform = 'scale(1)';
                this.style.cursor = 'zoom-in';
            }
        });
    });
}


// Tab functionality
document.addEventListener('DOMContentLoaded', async function () {
    // Initialize Supabase first
    window.scrollTo(0, 0);
// Start with 0% progress
    updateLoadingProgress(0);
    setupImageErrorHandling();
    initCookieSlider()
    initImageZoom();
    setupDesktopDetailEvents();
    
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

    // Update the checkout process to handle sale prices
document.getElementById("start-checkout").addEventListener("click", async function (e) {
    e.preventDefault();
    
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }

    // Final price validation with sale support
    const validation = await priceService.validateCart(cart);
    
    if (validation.validItems.length === 0) {
        showNotification('Your cart items are no longer available. Please refresh the page.');
        return;
    }

    if (validation.hasChanges) {
        // Update cart with current prices including sale prices
        saveCart(validation.validItems);
        updateCartUI();
        
        // Show detailed message about what changed
        if (validation.priceUpdates && validation.priceUpdates.length > 0) {
            const message = priceService.generatePriceUpdateMessage(validation.priceUpdates);
            showNotification('Cart updated with current prices:\n' + message, 5000);
        } else {
            showNotification('Cart updated with current prices. Please review before checkout.');
        }
        return;
    }

    // All good - proceed to checkout
    // You might want to pass sale information to checkout
    const checkoutData = {
        items: validation.validItems,
        total: validation.total,
        hasSaleItems: validation.validItems.some(item => item.isOnSale)
    };
    
    // Store checkout data temporarily
    localStorage.setItem('checkout_data', JSON.stringify(checkoutData));
    
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
