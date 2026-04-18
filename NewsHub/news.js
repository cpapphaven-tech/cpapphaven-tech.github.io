const feed = document.getElementById('news-feed');
const loader = document.getElementById('pmg-loader');
const catBtns = document.querySelectorAll('.cat-btn');

let currentCategory = 'top';

const FALLBACK_PICS = {
    "top": [
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?q=80&w=1200&auto=format&fit=crop"
    ],
    "gaming": [
        "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1486401899868-0e435ed85128?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=1200&auto=format&fit=crop"
    ],
    "technology": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop"
    ],
    "finance": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop"
    ],
    "sports": [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop"
    ],
    "entertainment": [
        "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1470229722913-7c092bce28f1?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop"
    ],
    "health": [
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1532938911079-1b06ac7cebe7?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1200&auto=format&fit=crop"
    ],
    "science": [
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=1200&auto=format&fit=crop"
    ]
};

// Returns a high-quality deterministic image based on category and title
function getCoverImage(cat, titleStr, overrideUrl) {
    if (overrideUrl && overrideUrl.length > 5) return overrideUrl;
    
    const pics = FALLBACK_PICS[cat] || FALLBACK_PICS["top"];
    let num = 0;
    const safeStr = titleStr || "News";
    for (let i = 0; i < safeStr.length; i++) num += safeStr.charCodeAt(i);
    
    return pics[num % pics.length];
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === "#") return "JUST NOW";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr.toUpperCase();

    const diff = new Date() - d;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return `UNDER 1H AGO`;
    if (hours < 24) return `${hours}H AGO`;
    return d.toLocaleDateString().toUpperCase();
}

function renderNews() {
    if (!window.NEWS_DATA) return;

    const articles = window.NEWS_DATA[currentCategory] || [];
    let html = '';

    articles.forEach((article, index) => {
        // Determine Image or Unsplash Fallback
        const finalImgUrl = getCoverImage(currentCategory, article.title, article.image);
        
        let mediaHtml = `
            <img class="snap-bg-blur" src="${finalImgUrl}" alt="">
            <img class="snap-bg-img" src="${finalImgUrl}" alt="Cover">
        `;

        // Determine Description (if exists and is long enough)
        let descHtml = '';
        if (article.description && article.description.length > 10) {
            descHtml = `<p class="snap-desc">${article.description}</p>`;
        }

        html += `
            <div class="snap-card">
                <div class="snap-bg-wrap">
                    ${mediaHtml}
                </div>
                <div class="snap-overlay"></div>
                
                <div class="snap-content">
                    <div class="snap-meta">
                        <span class="snap-source">${article.source}</span>
                        <span class="snap-date">${formatDate(article.pubDate)}</span>
                    </div>
                    <h2 class="snap-title">${article.title}</h2>
                    ${descHtml}
                    <a href="${article.link}" target="_blank" class="read-btn">
                        Read Story <span>↗</span>
                    </a>
                </div>
            </div>
        `;
    });

    if (articles.length === 0) {
        html = `<div class="snap-card" style="align-items:center; justify-content:center; color:#888;">No news fetched yet.</div>`;
    }

    feed.innerHTML = html;
}

function handleCategoryChange(e) {
    catBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    currentCategory = e.target.getAttribute('data-type');
    
    // Smooth reset to top
    feed.scrollTo({ top: 0, behavior: 'instant' });
    
    feed.style.opacity = '0.5';
    setTimeout(() => {
        renderNews();
        feed.style.opacity = '1';
    }, 150);
}

document.addEventListener('DOMContentLoaded', () => {
    catBtns.forEach(btn => btn.addEventListener('click', handleCategoryChange));
    
    renderNews();

    setTimeout(() => {
        if(loader) loader.style.display = 'none';
        document.body.classList.remove('pmg-sidebar-start-closed');
        
        // Trigger Playmix Global Ad Injections (Desktop Sidebar + Mobile Bottom)
        if (typeof window.prepSystem === 'function') {
            window.prepSystem();
        }
    }, 400); 
});
