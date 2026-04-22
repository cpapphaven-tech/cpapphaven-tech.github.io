const feed = document.getElementById('news-feed');
const loader = document.getElementById('pmg-loader');
const catBtns = document.querySelectorAll('.cat-btn');
const langToggleBtn = document.getElementById('btn-lang-toggle');

let currentCategory = 'local';

// ─── Module-level globals ───────────
let currentLang    = 'en';
let userCountry    = 'US';
let userRegion     = '';
let userCountryName= 'United States';
let nativeLang     = 'en';

// ─── I18N Dictionary (23+ languages) ──────────────────────
const I18N = {
    "en": { flag:"🌐 EN", dir:"ltr", read:"Read Story <span>↗</span>", source:"Source: ", no_news:"No news available.", swipe:"Swipe Up", legal:"Legal Disclaimer", legal_text_1:"All articles belong to their respective publishers. Playmix aggregates headlines via public RSS feeds.", legal_text_2:"For DMCA or takedown requests:", back_top:"Back to Top ↑", time_under1h:"UNDER 1H AGO", time_xhago:(h)=>`${h}H AGO`, cats:{ local:"📍 Local", top:"🌐 Top", finance:"📈 Finance", sports:"⚽ Sports", entertainment:"🎬 Ent.", technology:"💻 Tech", health:"⚕️ Health", gaming:"🎮 Gaming", science:"🔬 Science", ai:"🤖 AI" } },
    "ja": { flag:"🇯🇵 JA", dir:"ltr", read:"続きを読む <span>↗</span>", source:"提供元: ", no_news:"ニュースはありません。", swipe:"上にスワイプ", legal:"免責事項", legal_text_1:"すべてのコンテンツは元の発行者に帰属します。PlAYmixは公開RSSフィードを通じて見出しを集約します。", legal_text_2:"削除リクエスト:", back_top:"トップへ ↑", time_under1h:"1時間以内", time_xhago:(h)=>`${h}時間前`, cats:{ local:"📍 地域", top:"🌐 トップ", finance:"📈 金融", sports:"⚽ スポーツ", entertainment:"🎬 エンタメ", technology:"💻 テクノロジー", health:"⚕️ 健康", gaming:"🎮 ゲーム", science:"🔬 科学", ai:"🤖 AI" } },
    "de": { flag:"🇩🇪 DE", dir:"ltr", read:"Weiterlesen <span>↗</span>", source:"Quelle: ", no_news:"Keine Nachrichten verfügbar.", swipe:"Nach oben wischen", legal:"Rechtlicher Hinweis", legal_text_1:"Alle Artikel gehören ihren jeweiligen Verlagen. Playmix aggregiert Schlagzeilen über öffentliche RSS-Feeds.", legal_text_2:"Für DMCA-Anfragen:", back_top:"Nach oben ↑", time_under1h:"VOR <1 STD", time_xhago:(h)=>`VOR ${h} STD`, cats:{ local:"📍 Lokal", top:"🌐 Top", finance:"📈 Wirtschaft", sports:"⚽ Sport", entertainment:"🎬 Unterhaltung", technology:"💻 Tech", health:"⚕️ Gesundheit", gaming:"🎮 Gaming", science:"🔬 Wissenschaft", ai:"🤖 AI" } },
    "fr": { flag:"🇫🇷 FR", dir:"ltr", read:"Lire la suite <span>↗</span>", source:"Source: ", no_news:"Aucune actualité disponible.", swipe:"Glisser vers le haut", legal:"Mentions légales", legal_text_1:"Tous les articles appartiennent à leurs éditeurs. Playmix agrège des titres via des flux RSS publics.", legal_text_2:"Pour toute demande DMCA:", back_top:"Haut de page ↑", time_under1h:"IL Y A <1H", time_xhago:(h)=>`IL Y A ${h}H`, cats:{ local:"📍 Local", top:"🌐 À la une", finance:"📈 Économie", sports:"⚽ Sport", entertainment:"🎬 Culture", technology:"💻 Tech", health:"⚕️ Santé", gaming:"🎮 Jeux", science:"🔬 Sciences", ai:"🤖 AI" } },
    "es": { flag:"🇪🇸 ES", dir:"ltr", read:"Leer más <span>↗</span>", source:"Fuente: ", no_news:"No hay noticias disponibles.", swipe:"Desliza hacia arriba", legal:"Aviso Legal", legal_text_1:"Todos los artículos pertenecen a sus editores originales. Playmix agrega titulares a través de feeds RSS públicos.", legal_text_2:"Para solicitudes DMCA:", back_top:"Volver arriba ↑", time_under1h:"HACE <1H", time_xhago:(h)=>`HACE ${h}H`, cats:{ local:"📍 Local", top:"🌐 Top", finance:"📈 Economía", sports:"⚽ Deporte", entertainment:"🎬 Entretenimiento", technology:"💻 Tech", health:"⚕️ Salud", gaming:"🎮 Gaming", science:"🔬 Ciencia", ai:"🤖 AI" } },
    "pt": { flag:"🇧🇷 PT", dir:"ltr", read:"Ler mais <span>↗</span>", source:"Fonte: ", no_news:"Nenhuma notícia disponível.", swipe:"Deslize para cima", legal:"Aviso Legal", legal_text_1:"Todo o conteúdo pertence aos seus respectivos editores. O Playmix agrega manchetes via feeds RSS públicos.", legal_text_2:"Para solicitações DMCA:", back_top:"Voltar ao topo ↑", time_under1h:"HÁ <1H", time_xhago:(h)=>`HÁ ${h}H`, cats:{ local:"📍 Local", top:"🌐 Top", finance:"📈 Economia", sports:"⚽ Esportes", entertainment:"🎬 Entretenimento", technology:"💻 Tecnologia", health:"⚕️ Saúde", gaming:"🎮 Games", science:"🔬 Ciência", ai:"🤖 AI" } },
    "zh": { flag:"🇨🇳 ZH", dir:"ltr", read:"阅读全文 <span>↗</span>", source:"来源：", no_news:"暂无新闻。", swipe:"向上滑动", legal:"法律声明", legal_text_1:"所有文章归原始出版商所有。Playmix通过公开RSS源汇总新闻标题。", legal_text_2:"DMCA请求:", back_top:"返回顶部 ↑", time_under1h:"1小时内", time_xhago:(h)=>`${h}小时前`, cats:{ local:"📍 本地", top:"🌐 头条", finance:"📈 财经", sports:"⚽ 体育", entertainment:"🎬 娱乐", technology:"💻 科技", health:"⚕️ 健康", gaming:"🎮 游戏", science:"🔬 科学", ai:"🤖 AI" } },
    "ko": { flag:"🇰🇷 KO", dir:"ltr", read:"더 읽기 <span>↗</span>", source:"출처: ", no_news:"뉴스가 없습니다.", swipe:"위로 스와이프", legal:"법적 고지", legal_text_1:"모든 기사는 원래 발행인에게 속합니다. Playmix는 공개 RSS 피드를 통해 헤드라인을 수집합니다.", legal_text_2:"DMCA 요청:", back_top:"맨 위로 ↑", time_under1h:"1시간 이내", time_xhago:(h)=>`${h}시간 전`, cats:{ local:"📍 지역", top:"🌐 탑", finance:"📈 경제", sports:"⚽ 스포츠", entertainment:"🎬 엔터테인먼트", technology:"💻 기술", health:"⚕️ 건강", gaming:"🎮 게임", science:"🔬 과학", ai:"🤖 AI" } },
    "ar": { flag:"🇸🇦 AR", dir:"rtl", read:"اقرأ المزيد <span>↗</span>", source:"المصدر: ", no_news:"لا توجد أخبار.", swipe:"اسحب للأعلى", legal:"إخلاء المسؤولية", legal_text_1:"جميع المقالات تعود لناشريها. يجمع Playmix العनाوين عبر خلاصات RSS.", legal_text_2:"لطلبات الإزالة:", back_top:"العودة للأعلى ↑", time_under1h:"منذ أقل من ساعة", time_xhago:(h)=>`منذ ${h} ساعة`, cats:{ local:"📍 محلي", top:"🌐 الرئيسية", finance:"📈 اقتصاد", sports:"⚽ رياضة", entertainment:"🎬 ترفيه", technology:"💻 تقنية", health:"⚕️ صحة", gaming:"🎮 ألعاب", science:"🔬 علوم", ai:"🤖 AI" } },
    "hi": { flag:"🇮🇳 HI", dir:"ltr", read:"और पढ़ें <span>↗</span>", source:"स्रोत: ", no_news:"कोई समाचार उपलब्ध नहीं।", swipe:"ऊपर स्वाइप करें", legal:"कानूनी अस्वीकरण", legal_text_1:"सभी लेख उनके प्रकाशकों के हैं। Playmix RSS फ़ीड के माध्यम से समाचार एकत्र करता है।", legal_text_2:"DMCA अनुरोध के लिए संपर्क करें:", back_top:"शीर्ष पर वापस ↑", time_under1h:"1 घंटे से कम", time_xhago:(h)=>`${h} घंटे पहले`, cats:{ local:"📍 स्थानीय", top:"🌐 टॉप", finance:"📈 वित्त", sports:"⚽ खेल", entertainment:"🎬 मनोरंजन", technology:"💻 तकनीक", health:"⚕️ स्वास्थ्य", gaming:"🎮 गेमिंग", science:"🔬 विज्ञान", ai:"🤖 AI" } },
    "ru": { flag:"🇷🇺 RU", dir:"ltr", read:"Читать далее <span>↗</span>", source:"Источник: ", no_news:"Нет доступных новостей.", swipe:"Смахните вверх", legal:"Правовая оговорка", legal_text_1:"Все статьи принадлежат издателям. Playmix агрегирует заголовки через публичные RSS-ленты.", legal_text_2:"По вопросам DMCA:", back_top:"Наверх ↑", time_under1h:"МЕНЕЕ 1 Ч НАЗАД", time_xhago:(h)=>`${h} Ч НАЗАД`, cats:{ local:"📍 Local", top:"🌐 Главное", finance:"📈 Экономика", sports:"⚽ Спорт", entertainment:"🎬 Культура", technology:"💻 Технологии", health:"⚕️ Здоровье", gaming:"🎮 Игры", science:"🔬 Наука", ai:"🤖 AI" } },
    "it": { flag:"🇮🇹 IT", dir:"ltr", read:"Leggi di più <span>↗</span>", source:"Fonte: ", no_news:"Nessuna notizia disponibile.", swipe:"Scorri su", legal:"Note Legali", legal_text_1:"Tutti gli articoli appartengono ai rispettivi editori. Playmix aggrega titoli tramite feed RSS pubblici.", legal_text_2:"Per richieste DMCA:", back_top:"Torna su ↑", time_under1h:"MENO DI 1H FA", time_xhago:(h)=>`${h}H FA`, cats:{ local:"📍 Local", top:"🌐 Top", finance:"📈 Economia", sports:"⚽ Sport", entertainment:"🎬 Intrattenimento", technology:"💻 Tech", health:"⚕️ Salute", gaming:"🎮 Gaming", science:"🔬 Scienza", ai:"🤖 AI" } },
    "nl": { flag:"🇳🇱 NL", dir:"ltr", read:"Lees meer <span>↗</span>", source:"Bron: ", no_news:"Geen nieuws beschikbaar.", swipe:"Veeg omhoog", legal:"Juridische Kennisgeving", legal_text_1:"Alle artikelen zijn eigendom van hun uitgevers. Playmix aggregeert koppen via openbare RSS-feeds.", legal_text_2:"Voor DMCA-verzoeken:", back_top:"Terug naar boven ↑", time_under1h:"MINDER DAN 1U", time_xhago:(h)=>`${h}U GELEDEN`, cats:{ local:"📍 Local", top:"🌐 Top", finance:"📈 Economie", sports:"⚽ Sport", entertainment:"🎬 Entertainment", technology:"💻 Tech", health:"⚕️ Gezondheid", gaming:"🎮 Games", science:"🔬 Wetenschap", ai:"🤖 AI" } },
    "tr": { flag:"🇹🇷 TR", dir:"ltr", read:"Devamını oku <span>↗</span>", source:"Kaynak: ", no_news:"Haber bulunamadı.", swipe:"Yukarı kaydır", legal:"Yasal Uyarı", legal_text_1:"Tüm içerikler orijinal yayıncılarına aittir. Playmix, genel RSS akışları aracılığıyla başlıkları toplar.", legal_text_2:"DMCA talepleri için:", back_top:"Başa dön ↑", time_under1h:"1 SAATTEN AZ", time_xhago:(h)=>`${h} SAAT ÖNCE`, cats:{ local:"📍 Local", top:"🌐 Gündem", finance:"📈 Ekonomi", sports:"⚽ Spor", entertainment:"🎬 Eğlence", technology:"💻 Teknoloji", health:"⚕️ Sağlık", gaming:"🎮 Oyun", science:"🔬 Bilim", ai:"🤖 AI" } },
    "id": { flag:"🇮🇩 ID", dir:"ltr", read:"Baca selengkapnya <span>↗</span>", source:"Sumber: ", no_news:"Tidak ada berita tersedia.", swipe:"Geser ke atas", legal:"Pemberitahuan Hukum", legal_text_1:"Semua artikel adalah milik penerbit aslinya. Playmix mengumpulkan berita melalui umpan RSS publics.", legal_text_2:"For DMCA info:", back_top:"Kembali ke atas ↑", time_under1h:"KURANG DARI 1 JAM", time_xhago:(h)=>`${h} JAM LALU`, cats:{ local:"📍 Local", top:"🌐 Utama", finance:"📈 Ekonomi", sports:"⚽ Olahraga", entertainment:"🎬 Hiburan", technology:"💻 Teknologi", health:"⚕️ Kesehatan", gaming:"🎮 Game", science:"🔬 Sains", ai:"🤖 AI" } },
    "bn": { flag:"🇮🇳 BN", dir:"ltr", read:"আরও পড়ুন <span>↗</span>", source:"উৎস: ", no_news:"কোন খবর নেই", swipe:"উপরে সোয়াইপ করুন", legal:"আইনি দাবি অস্বীকার", legal_text_1:"সমস্ত নিবন্ধ প্রকাশকদের।", legal_text_2:"DMCA অনুরোধ:", back_top:"উপরে ফিরে যান ↑", time_under1h:"১ ঘণ্টার কম", time_xhago:(h)=>`${h} ঘণ্টা আগে`, cats:{ local:"📍 স্থানীয়", top:"🌐 শীর্ষ", finance:"📈 অর্থ", sports:"⚽ খেলা", entertainment:"🎬 বিনোদন", technology:"💻 টেক", health:"⚕️ স্বাস্থ্য", gaming:"🎮 গেমিং", science:"🔬 বিজ্ঞান", ai:"🤖 AI" } },
    "mr": { flag:"🇮🇳 MR", dir:"ltr", read:"पुढे वाचा <span>↗</span>", source:"स्रोत: ", no_news:"बातम्या उपलब्ध नाहीत", swipe:"वर स्वाइप करा", legal:"कायदेशीर अस्वीकरण", legal_text_1:"सर्व लेख प्रकाशकांचे आहेत।", legal_text_2:"DMCA विनंती:", back_top:"वरती जा ↑", time_under1h:"१ तासापूर्वी", time_xhago:(h)=>`${h} तासांपूर्वी`, cats:{ local:"📍 स्थानिक", top:"🌐 प्रमुख", finance:"📈 वित्त", sports:"⚽ क्रीडा", entertainment:"🎬 मनोरंजन", technology:"💻 तंत्रज्ञान", health:"⚕️ आरोग्य", gaming:"🎮 गेमिंग", science:"🔬 विज्ञान", ai:"🤖 AI" } },
    "te": { flag:"🇮🇳 TE", dir:"ltr", read:"మరిన్ని <span>↗</span>", source:"మూలం: ", no_news:"వార్తలు లేవు", swipe:"పైకి స్వైప్ చేయండి", legal:"లీగల్ డిస్క్లైమర్", legal_text_1:"అన్ని కథనాలు ప్రచురణకర్తలవి।", legal_text_2:"DMCA అభ్యర్థన:", back_top:"పైకి వెళ్లండి ↑", time_under1h:"1 గంట లోపు", time_xhago:(h)=>`${h} గంటల క్రితం`, cats:{ local:"📍 స్థానిక", top:"🌐 అగ్ర", finance:"📈 ఫైనాన్స్", sports:"⚽ క్రీడలు", entertainment:"🎬 వినోదం", technology:"💻 టెక్నాలజీ", health:"⚕️ ఆరోగ్యం", gaming:"🎮 గేమింగ్", science:"🔬 సైన్స్", ai:"🤖 AI" } },
    "ta": { flag:"🇮🇳 TA", dir:"ltr", read:"மேலும் படிக்க <span>↗</span>", source:"ஆதாரம்: ", no_news:"செய்திகள் இல்லை", swipe:"மேலே ஸ்வைப் செய்யவும்", legal:"சட்ட அறிவிப்பு", legal_text_1:"அனைத்து கட்டுரைகளும் வெளியீட்டாளர்களுக்கு சொந்தமானது।", legal_text_2:"DMCA கோரிக்கை:", back_top:"மேலே செல்லவும் ↑", time_under1h:"1 மணிநேரம் முன்", time_xhago:(h)=>`${h} மணிநேரம் முன்`, cats:{ local:"📍 உள்ளூர்", top:"🌐 முக்கிய", finance:"📈 நிதி", sports:"⚽ விளையாட்டு", entertainment:"🎬 பொழுதுபோக்கு", technology:"💻 தொழில்நுட்பம்", health:"⚕️ ஆரோக்கியம்", gaming:"🎮 கேমিங்", science:"🔬 அறிவியல்", ai:"🤖 AI" } },
    "gu": { flag:"🇮🇳 GU", dir:"ltr", read:"વધુ વાંચો <span>↗</span>", source:"સ્ત્રોત: ", no_news:"સમાચાર ઉપલબ્ધ નથી", swipe:"ઉપર સ્વાઇપ કરો", legal:"કાનૂની અસ્વીકરણ", legal_text_1:"બધા લેખો પ્રકાશકોના છે।", legal_text_2:"DMCA વિનંતી:", back_top:"ટોચ પર પાછા જાઓ ↑", time_under1h:"1 કલાક પહેલા", time_xhago:(h)=>`${h} કલાક પહેલા`, cats:{ local:"📍 સ્થાનિક", top:"🌐 મુખ્ય", finance:"📈 નાણાકીય", sports:"⚽ રમતગમત", entertainment:"🎬 મનોરંજન", technology:"💻 ટેકનોલોજી", health:"⚕️ આરોગ્ય", gaming:"🎮 ગેમિંગ", science:"🔬 વિજ્ઞાન", ai:"🤖 AI" } },
    "kn": { flag:"🇮🇳 KN", dir:"ltr", read:"ಇನ್ನಷ್ಟು <span>↗</span>", source:"ಮೂಲ: ", no_news:"ವಾರ್ತೆಗಳಿಲ್ಲ", swipe:"ಮೇಲಕ್ಕೆ ಸ್ವೈಪ್ ಮಾಡಿ", legal:"ಕಾನೂನು ಹಕ್ಕುತ್ಯಾಗ", legal_text_1:"ಎಲ್ಲಾ ಲೇಖನಗಳು ಪ್ರಕಾಶಕರವು।", legal_text_2:"DMCA ವಿನಂತಿ:", back_top:"ಮೇಲಕ್ಕೆ ಹೋಗಿ ↑", time_under1h:"1 ಗಂಟೆಯ ಹಿಂದೆ", time_xhago:(h)=>`${h} ಗಂಟೆಗಳ ಹಿಂದೆ`, cats:{ local:"📍 ಸ್ಥಳೀಯ", top:"🌐 ಪ್ರಮುಖ", finance:"📈 ಹಣಕಾಸು", sports:"⚽ ಕ್ರೀಡೆ", entertainment:"🎬 ಮನರಂಜನೆ", technology:"💻 ತಂತ್ರಜ್ಞಾನ", health:"⚕️ ಆರೋಗ್ಯ", gaming:"🎮 ಗೇಮಿಂಗ್", science:"🔬 ವಿಜ್ಞಾನ", ai:"🤖 AI" } },
    "ml": { flag:"🇮🇳 ML", dir:"ltr", read:"കൂടുതൽ വായിക്കുക <span>↗</span>", source:"ഉറവിടം: ", no_news:"വാർത്തകളില്ല", swipe:"മുകളിലേക്ക് സ്വൈപ്പ് ചെയ്യുക", legal:"ലീഗൽ ഡിസ്ക്ലൈമർ", legal_text_1:"എല്ലാ ലേഖനങ്ങളും പ്രസാധകരുടേതാണ്।", legal_text_2:"DMCA അഭ്യർത്ഥന:", back_top:"മുകളിലേക്ക് പോകുക ↑", time_under1h:"1 മണിക്കൂർ മുമ്പ്", time_xhago:(h)=>`${h} മണിക്കൂർ മുമ്പ്`, cats:{ local:"📍 പ്രാദേശികം", top:"🌐 പ്രധാനപ്പെട്ട", finance:"📈 ധനകാര്യം", sports:"⚽ സ്പോർട്സ്", entertainment:"🎬 വിനോദം", technology:"💻 സാങ്കേതികവിദ്യ", health:"⚕️ ആരോഗ്യം", gaming:"🎮 ഗെയിമിംഗ്", science:"🔬 ശാസ്ത്രം", ai:"🤖 AI" } },
    "pa": { flag:"🇮🇳 PA", dir:"ltr", read:"ਹੋਰ ਪੜ੍ਹੋ <span>↗</span>", source:"ਸਰੋਤ: ", no_news:"ਕੋਈ ਖ਼ਬਰ ਨਹੀਂ", swipe:"ਉੱਪਰ ਸਵਾਈਪ ਕਰੋ", legal:"ਕਾਨੂੰਨੀ ਡਿਸਕਲੇਮਰ", legal_text_1:"ਸਾਰੇ ਲੇਖ ਪ੍ਰਕਾਸ਼ਕਾਂ ਦੇ ਹਨ।", legal_text_2:"DMCA ਬੇਨਤੀ:", back_top:"ਉੱਪਰ ਜਾਓ ↑", time_under1h:"1 ਘੰਟੇ ਤੋਂ ਘੱਟ", time_xhago:(h)=>`${h} ਘੰਟੇ ਪਹਿਲਾਂ`, cats:{ local:"📍 ਸਥਾਨਕ", top:"🌐 ਖਾਸ", finance:"📈 ਵਿੱਤ", sports:"⚽ ਖੇਡਾਂ", entertainment:"🎬 ਮਨੋਰੰਜਨ", technology:"💻 ਤਕਨੀਕੀ", health:"⚕️ ਸਿਹਤ", gaming:"🎮 ਗੇਮਿੰਗ", science:"🔬 ਵਿਗਿਆਨ", ai:"🤖 AI" } }
};

const SEO_DATA = {
    "en": { t: "Daily Digest Reels — Swipe Global News | Playmix", d: "Swipe through today's top global news, gaming, technology, and more in an immersive reel experience." },
    "ja": { t: "デイリーダイジェスト・リール — 世界のニュースをスワイプ | Playmix", d: "ゲーム、テクノロジー、金融など、今日のトップニュースをスワイプしてチェック。" },
    "de": { t: "Daily Digest Reels — Globale Nachrichten Swipen | Playmix", d: "Wischen Sie sich durch die wichtigsten globalen Nachrichten des Tages aus den Bereichen Gaming, Technologie und Finanzen." },
    "fr": { t: "Daily Digest Reels — L'actu mondiale en un geste | Playmix", d: "Faites défiler les actualités mondiales du jour sur les jeux, la technologie et l'économie." },
    "es": { t: "Daily Digest Reels — Noticias globales deslizando | Playmix", d: "Desliza para leer las mejores noticias globales de hoy sobre juegos, tecnología y finanzas." },
    "pt": { t: "Daily Digest Reels — Notícias globais deslizando | Playmix", d: "Deslize pelas principais notícias globais de hoje sobre games, tecnologia e economia." },
    "zh": { t: "每日新闻简报 — 全球动态纵览 | Playmix", d: "滑动查看今日全球游戏、科技和财经领域的头条新闻。" },
    "ko": { t: "데일리 뉴스 릴 — 글로벌 이슈 스와이프 | Playmix", d: "오늘의 주요 글로벌 뉴스, 게임, 기술 소식을 스와이프하여 확인하세요." },
    "ar": { t: "ديلي دايجست ريلز — أخبار العالم بلمسة واحدة | بلايميكس", d: "تصفح أهم أخبار العالم اليوم في مجالات الألعاب والتقنية والاقتصاد بأسلوب ممتع." },
    "hi": { t: "डेली न्यूज़ रील्स — ताज़ा खबरें स्वाइप करें | Playmix", d: "गेमिंग, टेक और दुनिया की ताज़ा खबरों को रील स्टाइल में स्वाइप करें।" },
    "ru": { t: "Daily Digest Reels — Мировые новости свайпом | Playmix", d: "Смахните, чтобы прочитать главные мировые новости дня об играх, технологиях и экономике." },
    "it": { t: "Daily Digest Reels — Notizie globali con uno swipe | Playmix", d: "Scopri le principali notizie globali di oggi su videogiochi, tecnologia ed economia." },
    "nl": { t: "Daily Digest Reels — Wereldnieuws swipen | Playmix", d: "Veeg door het belangrijkste wereldnieuws van vandaag over games, technologie en economie." },
    "tr": { t: "Daily Digest Reels — Dünyadan Haberler Kaydırarak | Playmix", d: "Günün en önemli oyun, teknoloji ve ekonomi haberlerini kaydırarak keşfedin." },
    "id": { t: "Daily Digest Reels — Berita Global Sekali Geser | Playmix", d: "Geser untuk melihat berita global utama hari ini tentang game, teknologi, and ekonomi." },
    "bn": { t: "ডেইলি নিউজ রিল — আজকের বিশ্ববিখ্যাত খবরের হেডলাইন | Playmix", d: "গেমিং, প্রযুক্তি এবং বিশ্বের ব্রেकिंग নিউজ সরাসরি রিল স্টাইলে দেখুন।" },
    "mr": { t: "डेली न्यूज रील्स — ताज्या जगातील बातम्या | Playmix", d: "गेमिंग, तंत्रज्ञान आणि जगातील ताज्या बातम्या रील्स स्वरूपात स्वइप करून पाहा।" },
    "te": { t: "డైలీ న్యూస్ రీల్స్ — నేటి ముఖ్య వార్తలు | Playmix", d: "గేమింగ్, టెక్నాలజీ మరియు తాజా వార్తలను స్వైప్ ద్వారా త్వరగా చదవండి." },
    "ta": { t: "டெய்லி நியூஸ் రీల్స్ — இன்றைய உலகச் செய்திகள் | Playmix", d: "கேமிங், தொழில்நுட்பம் மற்றும் உலகப் செய்திகளை ஸ்வைப் மூலம் உடனுக்குடன் தெரிந்து கொள்ளுங்கள்." },
    "gu": { t: "ડેલી ન્યૂઝ రీల్સ — આજના મુખ્ય સમાચાર | Playmix", d: "ગેમિંગ, ટેકનોલોજી અને દુનિયાના તાજા સમાચાર રીલ્સ સ્ટાઈલમાં જુઓ." },
    "kn": { t: "ಡೈಲಿ ನ್ಯೂಸ್ ರೀಲ್ಸ್ — ಇಂದಿನ ಪ್ರಮುಖ ಸುದ್ದಿ | Playmix", d: "ಗೇಮಿಂಗ್, ತಂತ್ರಜ್ಞಾನ ಮತ್ತು ವಿಶ್ವದ ಪ್ರಮುಖ ಸುದ್ದಿಗಳನ್ನು ಅತ್ಯಂತ ಸುಲಭವಾಗಿ ಓದಿ." },
    "ml": { t: "ഡെയ്‌ലി న్యూస్ റീൽസ് — ഇന്നത്തെ പ്രസക്ത വാർത്തകൾ | Playmix", d: "ഗെയിമിംഗ്, ടെക്നോളജി തുടങ്ങി ഇന്നത്തെ പ്രധാന വാർത്തകൾ വിരൽത്തുമ്പിൽ." },
    "pa": { t: "ਡੇਲੀ ਨਿਊਜ਼ ਰੀਲਜ਼ — ਵਿਸ਼ਵ ਦੀਆਂ ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ | Playmix", d: "ਗੇਮਿੰਗ, ਟੈਕ ਅਤੇ ਵਿਸ਼ਵ ਦੀਆਂ ਖ਼ਬਰਾਂ ਨੂੰ ਸਵਾਈਪ ਰਾਹੀਂ ਆਸਾਨੀ ਨਾਲ ਦੇਖੋ।" }
};

const COUNTRY_LANG = {
    'JP':'ja', 'DE':'de','AT':'de','CH':'de', 'FR':'fr','BE':'fr',
    'ES':'es','MX':'es','AR':'es','CO':'es','CL':'es','PE':'es','VE':'es','EC':'es','BO':'es','PY':'es','UY':'es',
    'BR':'pt','PT':'pt', 'CN':'zh','TW':'zh','HK':'zh', 'KR':'ko',
    'SA':'ar','AE':'ar','EG':'ar','QA':'ar','KW':'ar','BH':'ar','OM':'ar','YE':'ar','IQ':'ar','JO':'ar','LB':'ar','SY':'ar',
    'IN':'hi','NP':'hi', 'RU':'ru','BY':'ru','KZ':'ru', 'IT':'it', 'NL':'nl', 'TR':'tr', 'ID':'id',
    'US':'en','GB':'en','AU':'en','CA':'en',' न्यूजीलैंड':'en','IE':'en','ZA':'en','SG':'en','PH':'en','PK':'en'
};

const IN_STATE_LANG = {
    'Maharashtra': 'mr', 'West Bengal': 'bn', 'Telangana': 'te', 'Andhra Pradesh': 'te',
    'Tamil Nadu': 'ta', 'Gujarat': 'gu', 'Karnataka': 'kn', 'Kerala': 'ml', 'Punjab': 'pa',
    'Delhi':'hi', 'Uttar Pradesh':'hi', 'Bihar':'hi', 'Rajasthan':'hi', 'Madhya Pradesh':'hi'
};

function getBrowserLang() {
    const code = (navigator.language || 'en').substring(0, 2).toLowerCase();
    return I18N[code] ? code : 'en';
}

async function detectLangAsync() {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang && I18N[urlLang]) return urlLang;

    const stored = localStorage.getItem('playmix_news_lang');
    if (stored && I18N[stored]) return stored;

    try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
        const data = await res.json();
        userCountry = data.country_code || 'US';
        userRegion  = data.region || '';
        userCountryName = data.country_name || 'United States';
        if (data.country_code === 'IN') return IN_STATE_LANG[data.region] || 'hi';
        const geoLang = COUNTRY_LANG[data.country_code];
        if (geoLang && I18N[geoLang]) return geoLang;
    } catch(e) {}
    return getBrowserLang();
}

function updateSEO() {
    const seo = SEO_DATA[currentLang] || SEO_DATA['en'];
    document.title = seo.t;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', seo.d);
}

function applyLang() {
    const L = I18N[currentLang] || I18N['en'];
    document.documentElement.dir  = L.dir;
    document.documentElement.lang = currentLang;
    updateSEO();
    catBtns.forEach(btn => {
        const t = btn.getAttribute('data-type');
        if (L.cats[t]) btn.innerText = L.cats[t];
    });
    const swipeTxt = document.querySelector('.swipe-hint span');
    if (swipeTxt) swipeTxt.innerText = L.swipe;
    if (langToggleBtn) {
        langToggleBtn.innerText = L.flag;
        langToggleBtn.style.display = 'flex';
    }
}

// ─── Translation ──────────────────────────────────────────
function cacheKey(t, l) { return `pmg_tr_${l}_${t.substring(0, 50)}`; }
async function translate(text, targetLang) {
    if (!text || targetLang === 'en') return null;
    const cached = sessionStorage.getItem(cacheKey(text, targetLang));
    if (cached) return cached;
    try {
        const q = encodeURIComponent(text.substring(0, 400));
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${q}`;
        const res = await fetch(url);
        const data = await res.json();
        const t = data[0]?.map(s => s?.[0] || '').join('').trim();
        if (t) { sessionStorage.setItem(cacheKey(text, targetLang), t); return t; }
    } catch (e) {}
    return null;
}

let _translationQueue = [];
let _isTranslating = false;

async function processQueue() {
    _isTranslating = true;
    while (_translationQueue.length > 0) {
        const { el, text, lang } = _translationQueue.shift();
        const t = await translate(text, lang);
        if (t && el) { el.textContent = t; el.classList.add('loaded'); el.classList.remove('hidden'); }
        await new Promise(r => setTimeout(r, 150));
    }
    _isTranslating = false;
}

// ─── UI Modal ─────────────────────────────────────────────
const LANG_NAMES = { "en": "English", "ja": "日本語", "de": "Deutsch", "fr": "Français", "es": "Español", "pt": "Português", "zh": "中文", "ko": "한국어", "hi": "हिन्दी", "ru": "Русский", "it": "Italiano", "nl": "Nederlands", "tr": "Türkçe", "id": "Indonesia" };
function showLangModal() {
    const list = document.getElementById('lang-list');
    if (list && list.children.length === 0) {
        Object.keys(I18N).forEach(code => {
            const item = document.createElement('div');
            item.className = `lang-item ${currentLang === code ? 'active' : ''}`;
            item.innerHTML = `<span>${I18N[code].flag}</span> ${LANG_NAMES[code] || code.toUpperCase()}`;
            item.onclick = () => selectLanguage(code);
            list.appendChild(item);
        });
    }
    document.getElementById('lang-modal')?.classList.remove('hidden');
}
async function selectLanguage(code) {
    currentLang = code;
    localStorage.setItem('playmix_news_lang', code);
    applyLang();
    document.getElementById('lang-modal')?.classList.add('hidden');
    feed.style.opacity = '0.4';
    setTimeout(() => { _translationQueue = []; renderNews(); feed.scrollTo(0,0); feed.style.opacity = '1'; }, 200);
}

// ─── Rendering ────────────────────────────────────────────
function formatDate(ds) {
    const L = I18N[currentLang] || I18N['en'];
    if (!ds || ds === '#') return L.time_under1h;
    const d = new Date(ds);
    if (isNaN(d)) return String(ds);
    const h = Math.floor((new Date() - d) / 3600000);
    return h < 1 ? L.time_under1h : (h < 24 ? L.time_xhago(h) : d.toLocaleDateString());
}

function renderNews() {
    if (!window.NEWS_DATA) return;
    const L = I18N[currentLang] || I18N['en'];
    
    // Determine the source dataset. 
    const indianLangs = ['bn','mr','te','ta','gu','kn','ml','pa'];
    let langData = window.NEWS_DATA[currentLang] || window.NEWS_DATA['en'] || window.NEWS_DATA;
    
    if (currentCategory === 'local' && indianLangs.includes(currentLang) && window.NEWS_DATA['hi']) {
        langData = window.NEWS_DATA['hi'];
    }
    
    let docs = [];

    if (currentCategory === 'local') {
        const native = langData['local'] || [];
        const top = langData['top'] || [];
        const all = Object.values(langData).flat();
        let terms = [userCountryName, userRegion].filter(Boolean);
        if (userCountry === 'IN') terms.push('India', 'Indian', 'Bharat');
        docs = native.length > 0 ? native : all.filter(a => terms.some(t => (a.title + a.source).toLowerCase().includes(t.toLowerCase())));
        if (docs.length < 5) docs = [...docs, ...top];
        docs = Array.from(new Set(docs.map(a => a.link))).map(l => docs.find(a => a.link === l));
    } else {
        docs = langData[currentCategory] || [];
        if (docs.length === 0 && currentLang !== 'en' && window.NEWS_DATA['en']) {
            docs = window.NEWS_DATA['en'][currentCategory] || [];
        }
    }

    let html = '';
    docs.forEach((a, i) => {
        const img = a.image || `https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800`;
        html += `
        <div class="snap-card">
            <div class="snap-bg-wrap"><img class="snap-bg-blur" src="${img}"><img class="snap-bg-img" src="${img}"></div>
            <div class="snap-overlay"></div>
            <div class="snap-content">
                <div class="snap-meta"><span class="snap-source">${L.source}${a.source}</span><span class="snap-date">${formatDate(a.pubDate)}</span></div>
                <h2 class="snap-title">${a.title}</h2>
                ${currentLang !== 'en' ? `<p class="snap-title-native hidden" id="t-n-${i}"></p>` : ''}
                <p class="snap-desc">${a.description || ''}</p>
                <a href="${a.link}" target="_blank" class="read-btn">${L.read}</a>
            </div>
        </div>`;
    });
    feed.innerHTML = html || `<div class="snap-card">${L.no_news}</div>`;

    if (currentLang !== 'en') {
        docs.forEach((a, i) => {
            const el = document.getElementById(`t-n-${i}`);
            if (el) _translationQueue.push({ el, text: a.title, lang: currentLang });
        });
        if (!_isTranslating) processQueue();
    }
}

// ─── Swipe Detection (Categories) ─────────────────────────
let touchStartX = 0;
let touchEndX   = 0;
let touchStartTime = 0;

feed.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartTime = Date.now();
}, { passive: true });

feed.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    const duration = Date.now() - touchStartTime;
    handleHorizontalSwipe(duration);
}, { passive: true });

function handleHorizontalSwipe(duration) {
    if (duration > 500) return;
    const diff = touchEndX - touchStartX;
    const threshold = 80;
    
    if (Math.abs(diff) < threshold) return;
    
    const categories = ['local','top','finance','sports','entertainment','technology','health','gaming','science','ai'];
    let idx = categories.indexOf(currentCategory);
    
    if (diff < 0) {
        idx = (idx + 1) % categories.length;
    } else {
        idx = (idx - 1 + categories.length) % categories.length;
    }
    
    const nextCat = categories[idx];
    const btn = document.querySelector(`.cat-btn[data-type="${nextCat}"]`);
    if (btn) btn.click();
}

// ─── Ads ──────────────────────────────────────────────────
// Ads are loaded via <script defer src="../ads.js"> in index.html

// ─── Boot ──────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    // Start processing as soon as possible
    currentLang = await detectLangAsync();
    applyLang();
    renderNews();
    
    // Trigger ad system
    if (typeof window.prepSystem === 'function') window.prepSystem();

    // Hide swipe hint on first scroll
    const swipeHint = document.getElementById('swipe-hint');
    if (swipeHint) {
        feed.addEventListener('scroll', () => {
            swipeHint.style.opacity = '0';
            setTimeout(() => swipeHint.remove(), 500);
        }, { once: true });
    }

    const activeBtn = document.querySelector('.cat-btn.active');
    if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
});

// Robust loader clearing
window.addEventListener('load', () => {
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }
});

catBtns.forEach(btn => {
    btn.onclick = () => {
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-type');
        renderNews();
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    };
});

langToggleBtn.onclick = showLangModal;
document.getElementById('btn-close-lang').onclick = () => document.getElementById('lang-modal').classList.add('hidden');
document.querySelector('.lang-modal-overlay').onclick = () => document.getElementById('lang-modal').classList.add('hidden');
