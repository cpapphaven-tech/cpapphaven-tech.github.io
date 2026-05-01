// Application Logic for World Tour
let currentLevel = 'home'; // home, list, viewer
let currentCategory = null;
let currentPlaces = [];
let currentIndex = 0;

// View Elements
const homeView = document.getElementById('home-view');
const listView = document.getElementById('list-view');
const viewerView = document.getElementById('viewer-view');
const headerH1 = document.getElementById('header-h1');
const breadcrumb = document.getElementById('breadcrumb');
const searchInput = document.getElementById('place-search');
const placesContainer = document.getElementById('places-container');
const iframe = document.getElementById('sv-iframe');
const loader = document.getElementById('viewer-loader');

function init() {
    renderCategories();
}

function renderCategories() {
    const countriesGrid = document.getElementById('countries-grid');
    
    countriesGrid.innerHTML = '';

    CATEGORIES.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-card';
        div.onclick = () => openCategory(cat);
        div.innerHTML = `
            <div class="cat-icon">${cat.icon}</div>
            <div class="cat-name">${cat.name}</div>
            <div class="cat-count">${cat.places.length} Places</div>
        `;
        
        countriesGrid.appendChild(div);
    });
}

function openCategory(cat) {
    currentLevel = 'list';
    currentCategory = cat;
    currentPlaces = cat.places;
    
    headerH1.textContent = `${cat.icon} ${cat.name}`;
    breadcrumb.textContent = `World Tour → ${cat.name}`;
    searchInput.value = '';
    
    homeView.classList.remove('active');
    homeView.classList.add('hidden');
    listView.classList.remove('hidden');
    listView.classList.add('active');
    
    renderPlaces();
}

function renderPlaces(filter = '') {
    placesContainer.innerHTML = '';
    
    const filtered = currentPlaces.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase()) || 
        p.country.toLowerCase().includes(filter.toLowerCase())
    );
    
    if (filtered.length === 0) {
        placesContainer.innerHTML = '<div style="text-align:center; padding: 30px; color:var(--muted);">No places found.</div>';
        return;
    }

    filtered.forEach(place => {
        const div = document.createElement('div');
        div.className = 'place-item';
        div.onclick = () => openViewer(place);
        div.innerHTML = `
            <div class="place-icon">${currentCategory.icon}</div>
            <div class="place-details">
                <div class="place-name">${place.name}</div>
                <div class="place-country">📍 ${place.country}</div>
            </div>
            <div class="place-action">▶</div>
        `;
        placesContainer.appendChild(div);
    });
}

function filterPlaces() {
    renderPlaces(searchInput.value);
}

function buildUrl(loc) {
    if (loc.pb) {
        return `https://www.google.com/maps/embed?pb=${loc.pb}`;
    }
    const heading = loc.heading || 0;
    const pitch = loc.pitch || 0;
    return `https://www.google.com/maps?layer=c&cbll=${loc.lat},${loc.lng}&cbp=0,${heading},0,0,${pitch}&output=svembed`;
}

function openViewer(place) {
    currentLevel = 'viewer';
    currentIndex = currentPlaces.findIndex(p => p.name === place.name);
    
    headerH1.textContent = place.name;
    breadcrumb.textContent = `${currentCategory.name} → ${place.country}`;
    
    listView.classList.remove('active');
    listView.classList.add('hidden');
    viewerView.classList.remove('hidden');
    viewerView.classList.add('active');
    
    loadCurrentIndex();
}

function loadCurrentIndex() {
    const place = currentPlaces[currentIndex];
    
    headerH1.textContent = place.name;
    breadcrumb.textContent = `${currentCategory.name} → ${place.country}`;
    
    document.getElementById('current-name').textContent = place.name;
    document.getElementById('current-country').textContent = place.country;
    
    loader.classList.remove('hidden');
    iframe.src = buildUrl(place);
}

function nextLocation() {
    currentIndex++;
    if (currentIndex >= currentPlaces.length) currentIndex = 0;
    loadCurrentIndex();
}

function prevLocation() {
    currentIndex--;
    if (currentIndex < 0) currentIndex = currentPlaces.length - 1;
    loadCurrentIndex();
}

function navigateBack() {
    if (currentLevel === 'viewer') {
        currentLevel = 'list';
        iframe.src = 'about:blank'; // Stop loading
        
        headerH1.textContent = `${currentCategory.icon} ${currentCategory.name}`;
        breadcrumb.textContent = `World Tour → ${currentCategory.name}`;
        
        viewerView.classList.remove('active');
        viewerView.classList.add('hidden');
        listView.classList.remove('hidden');
        listView.classList.add('active');
    } 
    else if (currentLevel === 'list') {
        currentLevel = 'home';
        currentCategory = null;
        
        headerH1.textContent = `🗺️ World Tour`;
        breadcrumb.textContent = `Explore the World`;
        
        listView.classList.remove('active');
        listView.classList.add('hidden');
        homeView.classList.remove('hidden');
        homeView.classList.add('active');
    }
    else {
        // Go back to main portal
        window.location.href = '../index.html';
    }
}

iframe.onload = () => {
    if (currentLevel === 'viewer') {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 300);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    init();
    if (typeof window.prepSystem === 'function') window.prepSystem();
});
