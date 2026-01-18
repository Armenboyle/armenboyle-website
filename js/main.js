/* =====================================================
   ArmenBoyle Travel Collection
   Main JavaScript
   ===================================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initPasswordProtection();
    initNavigation();
    initSmoothScroll();
    initScrollAnimations();
    initItineraryBuilder();
    initEricSidebar();
    initMap();
});

/* =====================================================
   Password Protection
   ===================================================== */
function initPasswordProtection() {
    const overlay = document.getElementById('password-overlay');
    const form = document.getElementById('password-form');
    const input = document.getElementById('password-input');

    // Check if already authenticated
    if (sessionStorage.getItem('armenboyle-authenticated') === 'true') {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
        return;
    }

    // Lock scroll when overlay is visible
    document.body.style.overflow = 'hidden';

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Password can be changed here - currently set to 'armenia2024'
        const correctPassword = 'armenia2024';

        if (input.value === correctPassword) {
            sessionStorage.setItem('armenboyle-authenticated', 'true');
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        } else {
            input.value = '';
            input.placeholder = 'Incorrect password';
            input.classList.add('error');

            setTimeout(() => {
                input.placeholder = 'Password';
                input.classList.remove('error');
            }, 2000);
        }
    });
}

/* =====================================================
   Navigation
   ===================================================== */
function initNavigation() {
    const nav = document.querySelector('.main-nav');
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    // Scroll behavior for nav background
    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Mobile menu toggle
    toggle.addEventListener('click', function() {
        links.classList.toggle('active');
        toggle.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    links.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            links.classList.remove('active');
            toggle.classList.remove('active');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target) && links.classList.contains('active')) {
            links.classList.remove('active');
            toggle.classList.remove('active');
        }
    });
}

/* =====================================================
   Smooth Scrolling
   ===================================================== */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* =====================================================
   Scroll Animations
   ===================================================== */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe cards and sections
    document.querySelectorAll('.card, .section-header, .log-entry').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

/* =====================================================
   Itinerary Builder - Drag and Drop
   ===================================================== */
function initItineraryBuilder() {
    const daysPanel = document.getElementById('days-panel');
    const addDayBtn = document.getElementById('add-day-btn');
    const removeDayBtn = document.getElementById('remove-day-btn');
    const clearBtn = document.getElementById('clear-itinerary-btn');

    if (!daysPanel) return;

    let dayCount = 3;
    const STORAGE_KEY = 'armenboyle-itinerary';

    // Load saved itinerary
    loadItinerary();

    // Drag and Drop for recommendation items
    const recItems = document.querySelectorAll('.rec-item');
    recItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });

    // Drop zones
    const dropzones = document.querySelectorAll('.day-dropzone');
    dropzones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });

    // Add Day
    if (addDayBtn) {
        addDayBtn.addEventListener('click', function() {
            if (dayCount >= 10) return;
            dayCount++;
            addDayColumn(dayCount);
            saveItinerary();
        });
    }

    // Remove Day
    if (removeDayBtn) {
        removeDayBtn.addEventListener('click', function() {
            if (dayCount <= 1) return;
            const lastDay = daysPanel.querySelector(`[data-day="${dayCount}"]`);
            if (lastDay) lastDay.remove();
            dayCount--;
            saveItinerary();
        });
    }

    // Clear All
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (confirm('Clear your entire itinerary?')) {
                document.querySelectorAll('.dropped-item').forEach(item => item.remove());
                localStorage.removeItem(STORAGE_KEY);
            }
        });
    }

    function handleDragStart(e) {
        this.classList.add('dragging');
        e.dataTransfer.setData('text/plain', JSON.stringify({
            name: this.querySelector('.item-name').textContent,
            location: this.querySelector('.item-location').textContent,
            category: this.dataset.category
        }));
        e.dataTransfer.effectAllowed = 'copy';
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        this.classList.add('drag-over');
    }

    function handleDragLeave() {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            addDroppedItem(this, data);
            saveItinerary();
        } catch (err) {
            console.error('Drop error:', err);
        }
    }

    function addDroppedItem(dropzone, data) {
        const item = document.createElement('div');
        item.className = 'dropped-item';
        item.dataset.category = data.category;
        item.innerHTML = `
            <span class="dropped-item-name">${data.name}</span>
            <button class="dropped-item-remove" title="Remove">×</button>
        `;

        // Remove button handler
        item.querySelector('.dropped-item-remove').addEventListener('click', function() {
            item.remove();
            saveItinerary();
        });

        dropzone.appendChild(item);
    }

    function addDayColumn(dayNum) {
        const column = document.createElement('div');
        column.className = 'day-column';
        column.dataset.day = dayNum;
        column.innerHTML = `
            <div class="day-header">
                <h4>Day ${dayNum}</h4>
            </div>
            <div class="day-dropzone" data-day="${dayNum}">
                <p class="dropzone-hint">Drop items here</p>
            </div>
        `;

        // Add drop handlers to new dropzone
        const dropzone = column.querySelector('.day-dropzone');
        dropzone.addEventListener('dragover', handleDragOver);
        dropzone.addEventListener('dragleave', handleDragLeave);
        dropzone.addEventListener('drop', handleDrop);

        daysPanel.appendChild(column);
    }

    function saveItinerary() {
        const itinerary = {};
        document.querySelectorAll('.day-column').forEach(col => {
            const day = col.dataset.day;
            const items = [];
            col.querySelectorAll('.dropped-item').forEach(item => {
                items.push({
                    name: item.querySelector('.dropped-item-name').textContent,
                    category: item.dataset.category
                });
            });
            itinerary[day] = items;
        });
        itinerary.dayCount = dayCount;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));
    }

    function loadItinerary() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        try {
            const itinerary = JSON.parse(saved);

            // Restore day count
            if (itinerary.dayCount && itinerary.dayCount > 3) {
                for (let i = 4; i <= itinerary.dayCount; i++) {
                    addDayColumn(i);
                }
                dayCount = itinerary.dayCount;
            }

            // Restore items
            Object.keys(itinerary).forEach(day => {
                if (day === 'dayCount') return;
                const dropzone = document.querySelector(`.day-dropzone[data-day="${day}"]`);
                if (dropzone && Array.isArray(itinerary[day])) {
                    itinerary[day].forEach(item => {
                        addDroppedItem(dropzone, item);
                    });
                }
            });
        } catch (err) {
            console.error('Load itinerary error:', err);
        }
    }
}

/* =====================================================
   Eric's Floating Sidebar
   ===================================================== */
function initEricSidebar() {
    const sidebar = document.getElementById('eric-sidebar');
    const toggle = document.getElementById('eric-toggle');

    if (!sidebar || !toggle) return;

    toggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });

    // Close when clicking outside
    document.addEventListener('click', function(e) {
        if (!sidebar.contains(e.target) && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
}

/* =====================================================
   Interactive Map
   ===================================================== */
function initMap() {
    // Check if map container exists
    const mapContainer = document.getElementById('armenia-map');
    if (!mapContainer) return;

    // Initialize map centered on Armenia
    const map = L.map('armenia-map', {
        center: [40.0691, 45.0382],
        zoom: 8,
        scrollWheelZoom: false,
        zoomControl: true
    });

    // Add lighter, more legible map tiles (Positron/light style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Custom marker icons
    const createIcon = (color) => {
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background: ${color};
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.8);
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            "></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            popupAnchor: [0, -10]
        });
    };

    const icons = {
        hotel: createIcon('#4A90A4'),
        restaurant: createIcon('#D4A574'),
        winery: createIcon('#8B4553'),
        cultural: createIcon('#9B8AA5'),
        museum: createIcon('#7A9B76')
    };

    // Location data
    const locations = [
        // Hotels
        {
            name: 'The Alexander, a Luxury Collection Hotel',
            category: 'hotel',
            type: 'Hotels',
            description: 'Premier luxury hotel in Yerevan',
            lat: 40.1792,
            lng: 44.5126
        },
        {
            name: 'Seven Visions Resort & Places, The Dvin',
            category: 'hotel',
            type: 'Hotels',
            description: 'Boutique accommodations in Yerevan',
            lat: 40.1850,
            lng: 44.5150
        },
        {
            name: 'Grand Hotel Yerevan',
            category: 'hotel',
            type: 'Hotels',
            description: 'Historic elegance in central Yerevan',
            lat: 40.1773,
            lng: 44.5086
        },
        {
            name: 'Tufenkian Old Dilijan Complex',
            category: 'hotel',
            type: 'Hotels',
            description: 'Mountain retreat in Dilijan',
            lat: 40.7416,
            lng: 44.8668
        },
        {
            name: 'Tufenkian Avan Marak Tsapatagh',
            category: 'hotel',
            type: 'Hotels',
            description: 'Lakeside retreat at Lake Sevan',
            lat: 40.3233,
            lng: 45.2667
        },

        // Restaurants
        {
            name: 'Mayrig',
            category: 'restaurant',
            type: 'Restaurants & Dining',
            description: 'Mediterranean-Armenian refined cuisine',
            lat: 40.1847,
            lng: 44.5155
        },
        {
            name: 'Lavash',
            category: 'restaurant',
            type: 'Restaurants & Dining',
            description: 'Elevated Armenian classics with tonir bread',
            lat: 40.1823,
            lng: 44.5103
        },
        {
            name: 'Sherep',
            category: 'restaurant',
            type: 'Restaurants & Dining',
            description: 'High-energy open kitchen experience',
            lat: 40.1795,
            lng: 44.5065
        },
        {
            name: 'In Vino',
            category: 'restaurant',
            type: 'Restaurants & Dining',
            description: 'Wine bar excellence',
            lat: 40.1810,
            lng: 44.5092
        },
        {
            name: 'Tsaghkunk',
            category: 'restaurant',
            type: 'Restaurants & Dining',
            description: 'Village-to-table dining',
            lat: 40.2333,
            lng: 44.7667
        },
        {
            name: 'Yasaman',
            category: 'restaurant',
            type: 'Restaurants & Dining',
            description: 'Lakeside dining at Lake Sevan',
            lat: 40.3667,
            lng: 45.0167
        },

        // Wineries
        {
            name: 'Trinity Canyon Vineyards',
            category: 'winery',
            type: 'Wineries',
            description: 'Artisanal boutique winery',
            lat: 39.7167,
            lng: 45.1833
        },
        {
            name: 'Old Bridge Winery',
            category: 'winery',
            type: 'Wineries',
            description: 'Heritage winemaking in Areni',
            lat: 39.7211,
            lng: 45.1817
        },
        {
            name: 'Zorah Wines',
            category: 'winery',
            type: 'Wineries',
            description: 'Award-winning Karasi wines',
            lat: 39.7633,
            lng: 45.3317
        },
        {
            name: 'Armenia Wine',
            category: 'winery',
            type: 'Wineries',
            description: 'Wine museum and tastings',
            lat: 40.0500,
            lng: 44.2833
        },
        {
            name: 'Van Ardi',
            category: 'winery',
            type: 'Wineries',
            description: 'High-altitude viticulture',
            lat: 40.0917,
            lng: 44.1500
        },
        {
            name: 'Voskevaz Winery',
            category: 'winery',
            type: 'Wineries',
            description: 'Historic estate winery',
            lat: 40.2500,
            lng: 44.2500
        },

        // Cultural Sites
        {
            name: 'Khor Virap',
            category: 'cultural',
            type: 'Cultural Sites',
            description: 'Iconic monastery with Mount Ararat views',
            lat: 39.8783,
            lng: 44.5761
        },
        {
            name: 'Noravank Monastery',
            category: 'cultural',
            type: 'Cultural Sites',
            description: '13th-century monastery in red-rock canyon',
            lat: 39.6847,
            lng: 45.2331
        },
        {
            name: 'Geghard Monastery',
            category: 'cultural',
            type: 'Cultural Sites',
            description: 'UNESCO World Heritage rock-cut monastery',
            lat: 40.1403,
            lng: 44.8178
        },
        {
            name: 'Temple of Garni',
            category: 'cultural',
            type: 'Cultural Sites',
            description: 'Greco-Roman pagan temple',
            lat: 40.1128,
            lng: 44.7300
        },
        {
            name: 'Sevanavank',
            category: 'cultural',
            type: 'Cultural Sites',
            description: '9th-century monastery at Lake Sevan',
            lat: 40.5667,
            lng: 44.9500
        },
        {
            name: 'Tatev Monastery',
            category: 'cultural',
            type: 'Cultural Sites',
            description: 'Medieval monastery via aerial tramway',
            lat: 39.3797,
            lng: 46.2497
        },

        // Museums & Markets
        {
            name: 'Cafesjian Center for the Arts',
            category: 'museum',
            type: 'Museums & Markets',
            description: 'Modern art museum at the Cascade',
            lat: 40.1914,
            lng: 44.5153
        },
        {
            name: 'Matenadaran',
            category: 'museum',
            type: 'Museums & Markets',
            description: 'Ancient manuscripts museum',
            lat: 40.1919,
            lng: 44.5211
        },
        {
            name: 'Parajanov Museum',
            category: 'museum',
            type: 'Museums & Markets',
            description: 'Dedicated to filmmaker Sergei Parajanov',
            lat: 40.1858,
            lng: 44.4997
        },
        {
            name: 'Mirzoyan Library',
            category: 'museum',
            type: 'Museums & Markets',
            description: 'Cultural hub and bookshop',
            lat: 40.1817,
            lng: 44.5078
        },
        {
            name: 'Vernissage Market',
            category: 'museum',
            type: 'Museums & Markets',
            description: 'Crafts and antiques open-air market',
            lat: 40.1783,
            lng: 44.5117
        },
        {
            name: 'GUM Market',
            category: 'museum',
            type: 'Museums & Markets',
            description: 'Central food market',
            lat: 40.1761,
            lng: 44.5042
        },
        {
            name: 'ARARAT Museum',
            category: 'museum',
            type: 'Museums & Markets',
            description: 'Legendary brandy museum and tastings',
            lat: 40.1800,
            lng: 44.4933
        },
        {
            name: 'Areni-1 Cave',
            category: 'museum',
            type: 'Museums & Markets',
            description: "World's oldest winery archaeological site",
            lat: 39.7250,
            lng: 45.1833
        }
    ];

    // Add markers to map
    locations.forEach(location => {
        const marker = L.marker([location.lat, location.lng], {
            icon: icons[location.category]
        }).addTo(map);

        marker.bindPopup(`
            <span class="popup-category">${location.type}</span>
            <h4>${location.name}</h4>
            <p>${location.description}</p>
        `);
    });

    // Enable scroll zoom when map is in focus
    map.on('focus', () => { map.scrollWheelZoom.enable(); });
    map.on('blur', () => { map.scrollWheelZoom.disable(); });
}

/* =====================================================
   Travel Log Entry (placeholder functionality)
   ===================================================== */
document.addEventListener('DOMContentLoaded', function() {
    const addEntryBtn = document.querySelector('.btn-add-entry');

    if (addEntryBtn) {
        addEntryBtn.addEventListener('click', function() {
            alert('Travel log entry editor would open here.\nThis feature can be expanded with a CMS or admin panel.');
        });
    }
});
