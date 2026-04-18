const feed = document.getElementById('news-feed');
const loader = document.getElementById('pmg-loader');
const catBtns = document.querySelectorAll('.cat-btn');
const langToggleBtn = document.getElementById('btn-lang-toggle');

let currentCategory = 'top';

// ─── I18N Dictionary (15 languages) ──────────────────────
const I18N = {
    "en": { flag:"🌐 EN", dir:"ltr", read:"Read Story <span>↗</span>", source:"Source: ", no_news:"No news available.", swipe:"Swipe Up", legal:"Legal Disclaimer", legal_text_1:"All articles belong to their respective publishers. Playmix aggregates headlines via public RSS feeds.", legal_text_2:"For DMCA or takedown requests:", back_top:"Back to Top ↑", time_under1h:"UNDER 1H AGO", time_xhago:(h)=>`${h}H AGO`, cats:{ top:"🌐 Top", gaming:"🎮 Gaming", technology:"💻 Tech", finance:"📈 Finance", sports:"⚽ Sports", entertainment:"🎬 Ent.", health:"⚕️ Health", science:"🔬 Science" } },
    "ja": { flag:"🇯🇵 JA", dir:"ltr", read:"続きを読む <span>↗</span>", source:"提供元: ", no_news:"ニュースはありません。", swipe:"上にスワイプ", legal:"免責事項", legal_text_1:"すべてのコンテンツは元の発行者に帰属します。PlAYmixは公開RSSフィードを通じて見出しを集約します。", legal_text_2:"削除リクエスト:", back_top:"トップへ ↑", time_under1h:"1時間以内", time_xhago:(h)=>`${h}時間前`, cats:{ top:"🌐 トップ", gaming:"🎮 ゲーム", technology:"💻 テクノロジー", finance:"📈 金融", sports:"⚽ スポーツ", entertainment:"🎬 エンタメ", health:"⚕️ 健康", science:"🔬 科学" } },
    "de": { flag:"🇩🇪 DE", dir:"ltr", read:"Weiterlesen <span>↗</span>", source:"Quelle: ", no_news:"Keine Nachrichten verfügbar.", swipe:"Nach oben wischen", legal:"Rechtlicher Hinweis", legal_text_1:"Alle Artikel gehören ihren jeweiligen Verlagen. Playmix aggregiert Schlagzeilen über öffentliche RSS-Feeds.", legal_text_2:"Für DMCA-Anfragen:", back_top:"Nach oben ↑", time_under1h:"VOR <1 STD", time_xhago:(h)=>`VOR ${h} STD`, cats:{ top:"🌐 Top", gaming:"🎮 Gaming", technology:"💻 Tech", finance:"📈 Wirtschaft", sports:"⚽ Sport", entertainment:"🎬 Unterhaltung", health:"⚕️ Gesundheit", science:"🔬 Wissenschaft" } },
    "fr": { flag:"🇫🇷 FR", dir:"ltr", read:"Lire la suite <span>↗</span>", source:"Source: ", no_news:"Aucune actualité disponible.", swipe:"Glisser vers le haut", legal:"Mentions légales", legal_text_1:"Tous les articles appartiennent à leurs éditeurs. Playmix agrège des titres via des flux RSS publics.", legal_text_2:"Pour toute demande DMCA:", back_top:"Haut de page ↑", time_under1h:"IL Y A <1H", time_xhago:(h)=>`IL Y A ${h}H`, cats:{ top:"🌐 À la une", gaming:"🎮 Jeux", technology:"💻 Tech", finance:"📈 Économie", sports:"⚽ Sport", entertainment:"🎬 Culture", health:"⚕️ Santé", science:"🔬 Sciences" } },
    "es": { flag:"🇪🇸 ES", dir:"ltr", read:"Leer más <span>↗</span>", source:"Fuente: ", no_news:"No hay noticias disponibles.", swipe:"Desliza hacia arriba", legal:"Aviso Legal", legal_text_1:"Todos los artículos pertenecen a sus editores originales. Playmix agrega titulares a través de feeds RSS públicos.", legal_text_2:"Para solicitudes DMCA:", back_top:"Volver arriba ↑", time_under1h:"HACE <1H", time_xhago:(h)=>`HACE ${h}H`, cats:{ top:"🌐 Top", gaming:"🎮 Gaming", technology:"💻 Tech", finance:"📈 Economía", sports:"⚽ Deporte", entertainment:"🎬 Entretenimiento", health:"⚕️ Salud", science:"🔬 Ciencia" } },
    "pt": { flag:"🇧🇷 PT", dir:"ltr", read:"Ler mais <span>↗</span>", source:"Fonte: ", no_news:"Nenhuma notícia disponível.", swipe:"Deslize para cima", legal:"Aviso Legal", legal_text_1:"Todo o conteúdo pertence aos seus respectivos editores. O Playmix agrega manchetes via feeds RSS públicos.", legal_text_2:"Para solicitações DMCA:", back_top:"Voltar ao topo ↑", time_under1h:"HÁ <1H", time_xhago:(h)=>`HÁ ${h}H`, cats:{ top:"🌐 Top", gaming:"🎮 Games", technology:"💻 Tecnologia", finance:"📈 Economia", sports:"⚽ Esportes", entertainment:"🎬 Entretenimento", health:"⚕️ Saúde", science:"🔬 Ciência" } },
    "zh": { flag:"🇨🇳 ZH", dir:"ltr", read:"阅读全文 <span>↗</span>", source:"来源：", no_news:"暂无新闻。", swipe:"向上滑动", legal:"法律声明", legal_text_1:"所有文章归原始出版商所有。Playmix通过公开RSS源汇总新闻标题。", legal_text_2:"DMCA请求:", back_top:"返回顶部 ↑", time_under1h:"1小时内", time_xhago:(h)=>`${h}小时前`, cats:{ top:"🌐 头条", gaming:"🎮 游戏", technology:"💻 科技", finance:"📈 财经", sports:"⚽ 体育", entertainment:"🎬 娱乐", health:"⚕️ 健康", science:"🔬 科学" } },
    "ko": { flag:"🇰🇷 KO", dir:"ltr", read:"더 읽기 <span>↗</span>", source:"출처: ", no_news:"뉴스가 없습니다.", swipe:"위로 스와이프", legal:"법적 고지", legal_text_1:"모든 기사는 원래 발행인에게 속합니다. Playmix는 공개 RSS 피드를 통해 헤드라인을 수집합니다.", legal_text_2:"DMCA 요청:", back_top:"맨 위로 ↑", time_under1h:"1시간 이내", time_xhago:(h)=>`${h}시간 전`, cats:{ top:"🌐 탑", gaming:"🎮 게임", technology:"💻 기술", finance:"📈 경제", sports:"⚽ 스포츠", entertainment:"🎬 엔터테인먼트", health:"⚕️ 건강", science:"🔬 과학" } },
    "ar": { flag:"🇸🇦 AR", dir:"rtl", read:"اقرأ المزيد <span>↗</span>", source:"المصدر: ", no_news:"لا توجد أخبار.", swipe:"اسحب للأعلى", legal:"إخلاء المسؤولية", legal_text_1:"جميع المقالات تعود لناشريها. يجمع Playmix العناوين عبر خلاصات RSS.", legal_text_2:"لطلبات الإزالة:", back_top:"العودة للأعلى ↑", time_under1h:"منذ أقل من ساعة", time_xhago:(h)=>`منذ ${h} ساعة`, cats:{ top:"🌐 الرئيسية", gaming:"🎮 ألعاب", technology:"💻 تقنية", finance:"📈 اقتصاد", sports:"⚽ رياضة", entertainment:"🎬 ترفيه", health:"⚕️ صحة", science:"🔬 علوم" } },
    "hi": { flag:"🇮🇳 HI", dir:"ltr", read:"और पढ़ें <span>↗</span>", source:"स्रोत: ", no_news:"कोई समाचार उपलब्ध नहीं।", swipe:"ऊपर स्वाइप करें", legal:"कानूनी अस्वीकरण", legal_text_1:"सभी लेख उनके प्रकाशकों के हैं। Playmix RSS फ़ीड के माध्यम से समाचार एकत्र करता है।", legal_text_2:"DMCA अनुरोध के लिए संपर्क करें:", back_top:"शीर्ष पर वापस ↑", time_under1h:"1 घंटे से कम", time_xhago:(h)=>`${h} घंटे पहले`, cats:{ top:"🌐 टॉप", gaming:"🎮 गेमिंग", technology:"💻 तकनीक", finance:"📈 वित्त", sports:"⚽ खेल", entertainment:"🎬 मनोरंजन", health:"⚕️ स्वास्थ्य", science:"🔬 विज्ञान" } },
    "ru": { flag:"🇷🇺 RU", dir:"ltr", read:"Читать далее <span>↗</span>", source:"Источник: ", no_news:"Нет доступных новостей.", swipe:"Смахните вверх", legal:"Правовая оговорка", legal_text_1:"Все статьи принадлежат издателям. Playmix агрегирует заголовки через публичные RSS-ленты.", legal_text_2:"По вопросам DMCA:", back_top:"Наверх ↑", time_under1h:"МЕНЕЕ 1 Ч НАЗАД", time_xhago:(h)=>`${h} Ч НАЗАД`, cats:{ top:"🌐 Главное", gaming:"🎮 Игры", technology:"💻 Технологии", finance:"📈 Экономика", sports:"⚽ Спорт", entertainment:"🎬 Культура", health:"⚕️ Здоровье", science:"🔬 Наука" } },
    "it": { flag:"🇮🇹 IT", dir:"ltr", read:"Leggi di più <span>↗</span>", source:"Fonte: ", no_news:"Nessuna notizia disponibile.", swipe:"Scorri su", legal:"Note Legali", legal_text_1:"Tutti gli articoli appartengono ai rispettivi editori. Playmix aggrega titoli tramite feed RSS pubblici.", legal_text_2:"Per richieste DMCA:", back_top:"Torna su ↑", time_under1h:"MENO DI 1H FA", time_xhago:(h)=>`${h}H FA`, cats:{ top:"🌐 Top", gaming:"🎮 Gaming", technology:"💻 Tech", finance:"📈 Economia", sports:"⚽ Sport", entertainment:"🎬 Intrattenimento", health:"⚕️ Salute", science:"🔬 Scienza" } },
    "nl": { flag:"🇳🇱 NL", dir:"ltr", read:"Lees meer <span>↗</span>", source:"Bron: ", no_news:"Geen nieuws beschikbaar.", swipe:"Veeg omhoog", legal:"Juridische Kennisgeving", legal_text_1:"Alle artikelen zijn eigendom van hun uitgevers. Playmix aggregeert koppen via openbare RSS-feeds.", legal_text_2:"Voor DMCA-verzoeken:", back_top:"Terug naar boven ↑", time_under1h:"MINDER DAN 1U", time_xhago:(h)=>`${h}U GELEDEN`, cats:{ top:"🌐 Top", gaming:"🎮 Games", technology:"💻 Tech", finance:"📈 Economie", sports:"⚽ Sport", entertainment:"🎬 Entertainment", health:"⚕️ Gezondheid", science:"🔬 Wetenschap" } },
    "tr": { flag:"🇹🇷 TR", dir:"ltr", read:"Devamını oku <span>↗</span>", source:"Kaynak: ", no_news:"Haber bulunamadı.", swipe:"Yukarı kaydır", legal:"Yasal Uyarı", legal_text_1:"Tüm içerikler orijinal yayıncılarına aittir. Playmix, genel RSS akışları aracılığıyla başlıkları toplar.", legal_text_2:"DMCA talepleri için:", back_top:"Başa dön ↑", time_under1h:"1 SAATTEN AZ", time_xhago:(h)=>`${h} SAAT ÖNCE`, cats:{ top:"🌐 Gündem", gaming:"🎮 Oyun", technology:"💻 Teknoloji", finance:"📈 Ekonomi", sports:"⚽ Spor", entertainment:"🎬 Eğlence", health:"⚕️ Sağlık", science:"🔬 Bilim" } },
    "id": { flag:"🇮🇩 ID", dir:"ltr", read:"Baca selengkapnya <span>↗</span>", source:"Sumber: ", no_news:"Tidak ada berita tersedia.", swipe:"Geser ke atas", legal:"Pemberitahuan Hukum", legal_text_1:"Semua artikel adalah milik penerbit aslinya. Playmix mengumpulkan berita melalui umpan RSS publik.", legal_text_2:"Untuk permintaan DMCA:", back_top:"Kembali ke atas ↑", time_under1h:"KURANG DARI 1 JAM", time_xhago:(h)=>`${h} JAM LALU`, cats:{ top:"🌐 Utama", gaming:"🎮 Game", technology:"💻 Teknologi", finance:"📈 Ekonomi", sports:"⚽ Olahraga", entertainment:"🎬 Hiburan", health:"⚕️ Kesehatan", science:"🔬 Sains" } }
};

// ─── Country → Language Map ───────────────────────────────
const COUNTRY_LANG = {
    'JP':'ja',
    'DE':'de','AT':'de','CH':'de',
    'FR':'fr','BE':'fr',
    'ES':'es','MX':'es','AR':'es','CO':'es','CL':'es','PE':'es','VE':'es','EC':'es','BO':'es','PY':'es','UY':'es',
    'BR':'pt','PT':'pt',
    'CN':'zh','TW':'zh','HK':'zh',
    'KR':'ko',
    'SA':'ar','AE':'ar','EG':'ar','QA':'ar','KW':'ar','BH':'ar','OM':'ar','YE':'ar','IQ':'ar','JO':'ar','LB':'ar','SY':'ar','MA':'ar','DZ':'ar','TN':'ar','LY':'ar',
    'IN':'hi','NP':'hi',
    'RU':'ru','BY':'ru','KZ':'ru',
    'IT':'it',
    'NL':'nl',
    'TR':'tr',
    'ID':'id',
    'US':'en','GB':'en','AU':'en','CA':'en','NZ':'en','IE':'en','ZA':'en','SG':'en','PH':'en','PK':'en','NG':'en','GH':'en','KE':'en'
};

// ─── Language Detection (async, IP-first) ─────────────────
// Priority: URL param → localStorage → IP Geolocation → navigator.language → 'en'
function getBrowserLang() {
    const code = (navigator.language || 'en').substring(0, 2).toLowerCase();
    return I18N[code] ? code : 'en';
}

async function detectLangAsync() {
    // 1. Explicit URL override
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang && I18N[urlLang]) return urlLang;

    // 2. User-saved preference
    const stored = localStorage.getItem('playmix_news_lang');
    if (stored && I18N[stored]) return stored;

    // 3. IP Geolocation (ipapi.co — free, 1000 req/day, no key needed)
    try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
        const geo = await res.json();
        const country = (geo.country_code || '').toUpperCase();
        console.log(`📍 Detected country: ${country} (${geo.country_name})`);
        const geoLang = COUNTRY_LANG[country];
        if (geoLang && I18N[geoLang]) {
            console.log(`🌐 Auto-language: ${geoLang}`);
            return geoLang;
        }
    } catch(e) {
        console.warn('IP geolocation unavailable, falling back to browser language.');
    }

    // 4. Browser navigator.language
    return getBrowserLang();
}

// ─── Translation Cache (sessionStorage) ──────────────────
function cacheKey(text, lang) { return `pmg_tr_${lang}_${text.substring(0, 60)}`; }

function getCached(text, lang) {
    try { return sessionStorage.getItem(cacheKey(text, lang)) || null; }
    catch(e) { return null; }
}
function setCache(text, lang, translated) {
    try { sessionStorage.setItem(cacheKey(text, lang), translated); }
    catch(e) {}
}

// ─── Translation via fetch() ─────────────────────────────
// JSONP was blocked by the site's script-src CSP.
// fetch() uses connect-src which is unrestricted on playmixgames.in
async function translateText(text, targetLang) {
    if (!text || targetLang === 'en') return null;

    // Skip if already non-English (non-ASCII dominant)
    const nonAscii = [...text].filter(c => c.charCodeAt(0) > 127).length;
    if (nonAscii / text.length > 0.35) return null;

    const cached = getCached(text, targetLang);
    if (cached) return cached;

    try {
        const q   = encodeURIComponent(text.substring(0, 400));
        const url = `https://api.mymemory.translated.world/get?q=${q}&langpair=en|${targetLang}&de=cpapphaven@gmail.com`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return null;
        const data = await res.json();
        const t = data?.responseData?.translatedText || '';
        // API returns responseStatus as string "200" — use == not ===
        if (t && data?.responseStatus == 200 && !t.includes('QUERY LENGTH LIMIT') && !t.includes('MYMEMORY')) {
            setCache(text, targetLang, t);
            return t;
        }
    } catch (e) { /* silent fail — show English only */ }
    return null;
}

// Alias for queue code
const translate = translateText;

// ─── Translation Queue ────────────────────────────────────
// Translates cards one-by-one with small delays to avoid rate limiting
let _translationQueue = [];
let _isTranslating = false;

function queueTranslation(cardIndex, titleEl, nativeTitleEl, descEl, nativeDescEl, title, desc) {
    _translationQueue.push({ cardIndex, titleEl, nativeTitleEl, descEl, nativeDescEl, title, desc });
    if (!_isTranslating) processTranslationQueue();
}

async function processTranslationQueue() {
    _isTranslating = true;
    while (_translationQueue.length > 0) {
        const job = _translationQueue.shift();
        const { nativeTitleEl, nativeDescEl, title, desc } = job;

        // Translate title
        const tTitle = await translate(title, currentLang);
        if (tTitle && nativeTitleEl) {
            nativeTitleEl.textContent = tTitle;
            nativeTitleEl.classList.add('loaded');
            nativeTitleEl.classList.remove('hidden');
        } else if (nativeTitleEl) {
            nativeTitleEl.classList.add('hidden');
        }

        // Translate description
        if (desc && nativeDescEl) {
            const tDesc = await translate(desc, currentLang);
            if (tDesc) {
                nativeDescEl.textContent = tDesc;
                nativeDescEl.classList.add('loaded');
                nativeDescEl.classList.remove('hidden');
            } else {
                nativeDescEl.classList.add('hidden');
            }
        }

        await new Promise(r => setTimeout(r, 120)); // polite delay
    }
    _isTranslating = false;
}

// ─── Apply Language to UI ─────────────────────────────────
function applyLang() {
    const L = I18N[currentLang];
    document.documentElement.dir  = L.dir;
    document.documentElement.lang = currentLang;
    catBtns.forEach(btn => {
        const t = btn.getAttribute('data-type');
        if (L.cats[t]) btn.innerText = L.cats[t];
    });
    const swipeTxt = document.querySelector('.swipe-hint span');
    if (swipeTxt) swipeTxt.innerText = L.swipe;
    if (langToggleBtn) {
        const other = (currentLang === 'en') ? nativeLang : 'en';
        langToggleBtn.innerText = (I18N[other] || I18N['en']).flag;
        langToggleBtn.style.display = nativeLang === 'en' ? 'none' : 'flex';
    }
}

function toggleLanguage() {
    currentLang = (currentLang === 'en') ? nativeLang : 'en';
    localStorage.setItem('playmix_news_lang', currentLang);
    applyLang();
    feed.style.opacity = '0.5';
    setTimeout(() => {
        _translationQueue = [];
        renderNews();
        feed.scrollTo({ top: 0, behavior: 'instant' });
        feed.style.opacity = '1';
    }, 150);
}

// ─── Fallback Images ─────────────────────────────────────
const FALLBACK_PICS = {
    top:           ["https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200","https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200"],
    gaming:        ["https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200","https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200"],
    technology:    ["https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200","https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200"],
    finance:       ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200","https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200"],
    sports:        ["https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200","https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200"],
    entertainment: ["https://images.unsplash.com/photo-1603190287605-e6ade32fa852?q=80&w=1200","https://images.unsplash.com/photo-1470229722913-7c092bce28f1?q=80&w=1200"],
    health:        ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1200","https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1200"],
    science:       ["https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1200","https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=1200"]
};

function getCoverImage(cat, title, override) {
    if (override && override.length > 5) return override;
    const pics = FALLBACK_PICS[cat] || FALLBACK_PICS.top;
    let n = 0; for (let i=0;i<(title||'').length;i++) n+=title.charCodeAt(i);
    return pics[n % pics.length];
}

function formatDate(dateStr) {
    const L = I18N[currentLang];
    if (!dateStr || dateStr === '#') return L.time_under1h;
    const d = new Date(dateStr);
    if (isNaN(d)) return String(dateStr).toUpperCase();
    const h = Math.floor((new Date() - d) / 3600000);
    if (h < 1) return L.time_under1h;
    if (h < 24) return L.time_xhago(h);
    return d.toLocaleDateString().toUpperCase();
}

// ─── Render ───────────────────────────────────────────────
function renderNews() {
    if (!window.NEWS_DATA) return;
    const L = I18N[currentLang];
    _translationQueue = [];

    const langData = window.NEWS_DATA[currentLang] || window.NEWS_DATA['en'] || window.NEWS_DATA;
    const articles  = langData[currentCategory] || [];
    let html = '';

    const showBilingual = (currentLang !== 'en');

    articles.forEach((article, idx) => {
        const img = getCoverImage(currentCategory, article.title, article.image);
        // Native slots start hidden; filled in asynchronously after render
        const nativeTitleSlot = showBilingual
            ? `<p class="snap-title-native" id="native-title-${idx}"></p>` : '';
        const descBlock = (article.description && article.description.length > 10)
            ? `<p class="snap-desc">${article.description}</p>
               ${showBilingual ? `<p class="snap-desc-native" id="native-desc-${idx}"></p>` : ''}`
            : '';

        html += `
        <div class="snap-card">
            <div class="snap-bg-wrap">
                <img class="snap-bg-blur" src="${img}" alt="">
                <img class="snap-bg-img"  src="${img}" alt="Cover">
            </div>
            <div class="snap-overlay"></div>
            <div class="snap-content">
                <div class="snap-meta">
                    <span class="snap-source">${L.source}${article.source}</span>
                    <span class="snap-date">${formatDate(article.pubDate)}</span>
                </div>
                <h2 class="snap-title" id="en-title-${idx}">${article.title}</h2>
                ${nativeTitleSlot}
                ${descBlock}
                <a href="${article.link}" target="_blank" rel="noopener noreferrer nofollow" class="read-btn">
                    ${L.read}
                </a>
            </div>
        </div>`;
    });

    if (articles.length === 0) {
        html = `<div class="snap-card" style="align-items:center;justify-content:center;color:#888;">${L.no_news}</div>`;
    } else {
        html += `
        <div class="snap-card" style="background:#0a0a0f;justify-content:center;align-items:center;text-align:center;padding:40px;">
            <div style="max-width:400px;">
                <div style="font-size:3rem;margin-bottom:20px;">⚖️</div>
                <h3 style="color:#fff;margin-bottom:15px;font-size:1.5rem;font-weight:800;">${L.legal}</h3>
                <p style="color:#888;font-size:.9rem;line-height:1.6;margin-bottom:20px;">${L.legal_text_1}</p>
                <p style="color:#888;font-size:.9rem;line-height:1.6;margin-bottom:30px;">${L.legal_text_2}<br>
                    <a href="mailto:cpapphaven@gmail.com" style="color:#3b82f6;text-decoration:none;font-weight:bold;">cpapphaven@gmail.com</a>
                </p>
                <button class="cat-btn active" onclick="feed.scrollTo({top:0,behavior:'smooth'})" style="padding:12px 30px;">${L.back_top}</button>
            </div>
        </div>`;
    }

    feed.innerHTML = html;

    // Queue async translations for each card (non-blocking)
    if (showBilingual) {
        articles.forEach((article, idx) => {
            const nativeTitleEl = document.getElementById(`native-title-${idx}`);
            const nativeDescEl  = document.getElementById(`native-desc-${idx}`);
            if (nativeTitleEl) {
                queueTranslation(idx, null, nativeTitleEl, null, nativeDescEl,
                    article.title, article.description || '');
            }
        });
    }
}

function handleCategoryChange(e) {
    catBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentCategory = e.target.getAttribute('data-type');
    feed.scrollTo({ top:0, behavior:'instant' });
    feed.style.opacity = '0.5';
    setTimeout(() => { renderNews(); feed.style.opacity = '1'; }, 150);
}

// ─── Module-level lang vars (set async in Init) ───────────
let currentLang = 'en';
let nativeLang  = getBrowserLang();

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Detect language before rendering (geo lookup + fallbacks)
    currentLang = await detectLangAsync();
    nativeLang  = getBrowserLang();

    catBtns.forEach(btn => btn.addEventListener('click', handleCategoryChange));
    if (langToggleBtn) langToggleBtn.addEventListener('click', toggleLanguage);

    applyLang();
    renderNews();

    setTimeout(() => {
        if (loader) loader.style.display = 'none';
        document.body.classList.remove('pmg-sidebar-start-closed');
        if (typeof window.prepSystem === 'function') window.prepSystem();
    }, 400);

    // Swipe hint dismiss
    const hint = document.getElementById('swipe-hint');
    if (hint) {
        const onScroll = () => {
            if (feed.scrollTop > 50) {
                hint.style.opacity = '0';
                setTimeout(() => { if (hint.parentNode) hint.remove(); }, 500);
                feed.removeEventListener('scroll', onScroll);
            }
        };
        feed.addEventListener('scroll', onScroll, { passive: true });
    }
});
