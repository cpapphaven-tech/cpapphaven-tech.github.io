import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import os
import time
import datetime
import re

# ─────────────────────────────────────────────────────────────
# Multi-Language RSS Feed Registry (15 languages)
# ─────────────────────────────────────────────────────────────
LANG_FEEDS = {
    "en": {
        "top":           "https://news.yahoo.com/rss/",
        "technology":    "https://techcrunch.com/feed/",
        "gaming":        "https://feeds.feedburner.com/ign/news",
        "finance":       "https://finance.yahoo.com/news/rss",
        "sports":        "https://sports.yahoo.com/rss/",
        "entertainment": "https://news.yahoo.com/rss/entertainment",
        "health":        "https://news.yahoo.com/rss/health",
        "science":       "https://news.yahoo.com/rss/science"
    },
    "ja": {
        "top":           "https://news.yahoo.co.jp/rss/topics/top-picks.xml",
        "technology":    "https://news.yahoo.co.jp/rss/topics/it.xml",
        "gaming":        "https://game.watch.impress.co.jp/data/rss/1.0/gmw/feed.rdf",
        "finance":       "https://news.yahoo.co.jp/rss/topics/business.xml",
        "sports":        "https://news.yahoo.co.jp/rss/topics/sports.xml",
        "entertainment": "https://news.yahoo.co.jp/rss/topics/entertainment.xml",
        "health":        "https://news.yahoo.co.jp/rss/topics/science.xml",
        "science":       "https://news.yahoo.co.jp/rss/topics/science.xml"
    },
    "de": {
        "top":           "https://www.tagesschau.de/xml/rss2/",
        "technology":    "https://www.heise.de/rss/heise.rdf",
        "gaming":        "https://www.gamestar.de/rss/rss.xml",
        "finance":       "https://www.handelsblatt.com/contentexport/feed/top-themen",
        "sports":        "https://www.sport1.de/news.rss",
        "entertainment": "https://www.stern.de/kultur/rss.xml",
        "health":        "https://www.apotheken-umschau.de/feeds/news.xml",
        "science":       "https://www.wissenschaft.de/feed/"
    },
    "fr": {
        "top":           "https://www.lemonde.fr/rss/une.xml",
        "technology":    "https://www.clubic.com/feed/actualite.rss",
        "gaming":        "https://www.jeuxvideo.com/rss/rss.xml",
        "finance":       "https://www.lemonde.fr/economie/rss_full.xml",
        "sports":        "https://www.lequipe.fr/rss/actu_rss.xml",
        "entertainment": "https://www.allocine.fr/rss/news.xml",
        "health":        "https://www.pourquoidocteur.fr/rss/articles.rss",
        "science":       "https://www.futura-sciences.com/rss/actualites.rss"
    },
    "es": {
        "top":           "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",
        "technology":    "https://www.xataka.com/feed.xml",
        "gaming":        "https://www.3djuegos.com/rss/noticias.xml",
        "finance":       "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada",
        "sports":        "https://as.com/rss/tags/ultimas_noticias.xml",
        "entertainment": "https://www.formulatv.com/rss/noticias.xml",
        "health":        "https://www.infosalus.com/rss/portada.xml",
        "science":       "https://www.agenciasinc.es/rss/noticias"
    },
    "pt": {
        "top":           "https://feeds.folha.uol.com.br/emcimadahora/rss091.xml",
        "technology":    "https://tecnoblog.net/feed/",
        "gaming":        "https://www.tecmundo.com.br/rss/news/",
        "finance":       "https://feeds.folha.uol.com.br/mercado/rss091.xml",
        "sports":        "https://www.globoesporte.globo.com/index.rss",
        "entertainment": "https://feeds.folha.uol.com.br/ilustrada/rss091.xml",
        "health":        "https://saude.abril.com.br/feed/",
        "science":       "https://exame.com/tecnologia/feed/"
    },
    "zh": {
        "top":           "https://feeds.bbci.co.uk/zhongwen/simp/rss.xml",
        "technology":    "https://www.solidot.org/index.rss",
        "gaming":        "https://www.gamersky.com/rss.html",
        "finance":       "https://feeds.bbci.co.uk/zhongwen/simp/business/rss.xml",
        "sports":        "https://feeds.bbci.co.uk/zhongwen/simp/sport/rss.xml",
        "entertainment": "https://feeds.bbci.co.uk/zhongwen/simp/entertainment_and_arts/rss.xml",
        "health":        "https://feeds.bbci.co.uk/zhongwen/simp/health/rss.xml",
        "science":       "https://feeds.bbci.co.uk/zhongwen/simp/science_and_environment/rss.xml"
    },
    "ko": {
        "top":           "https://www.yonhapnews.co.kr/RSS/major.xml",
        "technology":    "https://www.yonhapnews.co.kr/RSS/it.xml",
        "gaming":        "https://www.inven.co.kr/board/webzine/2097?iskin=webzine&rss=1",
        "finance":       "https://www.yonhapnews.co.kr/RSS/economy.xml",
        "sports":        "https://www.yonhapnews.co.kr/RSS/sports.xml",
        "entertainment": "https://www.yonhapnews.co.kr/RSS/entertainment.xml",
        "health":        "https://www.yonhapnews.co.kr/RSS/health.xml",
        "science":       "https://www.yonhapnews.co.kr/RSS/science.xml"
    },
    "ar": {
        "top":           "https://www.aljazeera.net/aljazeerarss/a2/b2",
        "technology":    "https://www.aljazeera.net/aljazeerarss/a2/b10",
        "gaming":        "https://www.aljazeera.net/aljazeerarss/a2/b2",
        "finance":       "https://www.aljazeera.net/aljazeerarss/a2/b6",
        "sports":        "https://www.aljazeera.net/aljazeerarss/a2/b13",
        "entertainment": "https://www.aljazeera.net/aljazeerarss/a2/b2",
        "health":        "https://www.aljazeera.net/aljazeerarss/a2/b9",
        "science":       "https://www.aljazeera.net/aljazeerarss/a2/b10"
    },
    "hi": {
        "top":           "https://feeds.feedburner.com/ndtvnews-top-stories",
        "technology":    "https://feeds.feedburner.com/ndtv/technology",
        "gaming":        "https://feeds.feedburner.com/ndtv/technology",
        "finance":       "https://feeds.feedburner.com/ndtv/business",
        "sports":        "https://feeds.feedburner.com/ndtv/sports",
        "entertainment": "https://feeds.feedburner.com/ndtv/entertainment",
        "health":        "https://feeds.feedburner.com/ndtv/health",
        "science":       "https://feeds.feedburner.com/ndtv/science"
    },
    "ru": {
        "top":           "https://lenta.ru/rss/articles",
        "technology":    "https://lenta.ru/rss/articles/internet",
        "gaming":        "https://lenta.ru/rss/articles/games",
        "finance":       "https://lenta.ru/rss/articles/economics",
        "sports":        "https://lenta.ru/rss/articles/sport",
        "entertainment": "https://lenta.ru/rss/articles/culture",
        "health":        "https://lenta.ru/rss/articles/medicine",
        "science":       "https://lenta.ru/rss/articles/science"
    },
    "it": {
        "top":           "https://www.corriere.it/rss/homepage.xml",
        "technology":    "https://www.corriere.it/rss/tecnologia.xml",
        "gaming":        "https://www.everyeye.it/rss/notizie.xml",
        "finance":       "https://www.corriere.it/rss/economia.xml",
        "sports":        "https://www.corriere.it/rss/sport.xml",
        "entertainment": "https://www.corriere.it/rss/spettacoli.xml",
        "health":        "https://www.corriere.it/rss/salute.xml",
        "science":       "https://www.corriere.it/rss/scienze.xml"
    },
    "nl": {
        "top":           "https://feeds.nos.nl/nosnieuwsalgemeen",
        "technology":    "https://feeds.nos.nl/nosnieuwstech",
        "gaming":        "https://feeds.nos.nl/nosnieuwsalgemeen",
        "finance":       "https://feeds.nos.nl/nosnieuwseconomie",
        "sports":        "https://feeds.nos.nl/nossportalgemeen",
        "entertainment": "https://feeds.nos.nl/nosnieuwsalgemeen",
        "health":        "https://feeds.nos.nl/nosnieuwsalgemeen",
        "science":       "https://feeds.nos.nl/nosnieuwsalgemeen"
    },
    "tr": {
        "top":           "https://www.hurriyet.com.tr/rss/anasayfa",
        "technology":    "https://www.hurriyet.com.tr/rss/teknoloji",
        "gaming":        "https://www.hurriyet.com.tr/rss/teknoloji",
        "finance":       "https://www.hurriyet.com.tr/rss/ekonomi",
        "sports":        "https://www.hurriyet.com.tr/rss/spor",
        "entertainment": "https://www.hurriyet.com.tr/rss/cumartesi",
        "health":        "https://www.hurriyet.com.tr/rss/anasayfa",
        "science":       "https://www.hurriyet.com.tr/rss/teknoloji"
    },
    "id": {
        "top":           "https://rss.kompas.com/nasional",
        "technology":    "https://rss.kompas.com/tekno",
        "gaming":        "https://rss.kompas.com/tekno",
        "finance":       "https://rss.kompas.com/ekonomi",
        "sports":        "https://rss.kompas.com/bola",
        "entertainment": "https://rss.kompas.com/entertainment",
        "health":        "https://rss.kompas.com/health",
        "science":       "https://rss.kompas.com/tekno"
    }
}

# ─────────────────────────────────────────────────────────────
# Translation via MyMemory API (free, no key required)
# Using contact email increases daily quota to 10,000 chars
# ─────────────────────────────────────────────────────────────
TRANSLATE_EMAIL = "cpapphaven@gmail.com"
_translation_cache = {}   # (text, lang) → translated text

def translate_text(text, target_lang):
    """
    Translate a piece of text into target_lang using MyMemory API.
    Returns original text on failure. Caches results to avoid duplicates.
    Only translates if text appears to be in English (ASCII-dominant).
    """
    if not text or target_lang == "en":
        return text

    # Heuristic: if >30% of chars are non-ASCII, assume already localised
    non_ascii = sum(1 for c in text if ord(c) > 127)
    if non_ascii / max(len(text), 1) > 0.30:
        return text

    cache_key = (text[:120], target_lang)
    if cache_key in _translation_cache:
        return _translation_cache[cache_key]

    try:
        encoded = urllib.parse.quote(text[:500])   # API cap per request
        url = (
            f"https://api.mymemory.translated.world/get"
            f"?q={encoded}&langpair=en|{target_lang}&de={TRANSLATE_EMAIL}"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
            translated = data.get("responseData", {}).get("translatedText", "")
            match = data.get("responseStatus", 0)

            # MyMemory returns QUERY LENGTH LIMIT REACHED on quota exceeded
            if translated and "QUERY LENGTH LIMIT" not in translated and match == 200:
                _translation_cache[cache_key] = translated
                return translated
    except Exception as e:
        print(f"    ⚠️ Translation skipped ({target_lang}): {e}")

    _translation_cache[cache_key] = text   # Cache original as fallback
    return text

# ─────────────────────────────────────────────────────────────
# RSS Parsing Helpers
# ─────────────────────────────────────────────────────────────
def extract_image_from_item(item):
    media_content = item.find('.//{http://search.yahoo.com/mrss/}content')
    if media_content is not None and 'url' in media_content.attrib:
        return media_content.attrib['url']
    enclosure = item.find('enclosure')
    if enclosure is not None and 'url' in enclosure.attrib and 'image' in enclosure.attrib.get('type', ''):
        return enclosure.attrib['url']
    desc = item.find('description')
    if desc is not None and desc.text:
        match = re.search(r'<img[^>]+src="([^">]+)"', desc.text)
        if match:
            return match.group(1)
    return ""

def clean_html_text(html_content):
    if not html_content:
        return ""
    text = re.sub(r'<[^>]+>', ' ', html_content)
    text = text.replace('&nbsp;', ' ').replace('&quot;', '"').replace('&amp;', '&') \
               .replace('&#39;', "'").replace('&lt;', '<').replace('&gt;', '>')
    return re.sub(r'\s+', ' ', text).strip()

def fetch_and_parse(url, limit=20):
    items = []
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept':     'application/rss+xml, application/xml, text/xml'
        })
        with urllib.request.urlopen(req, timeout=10) as response:
            root = ET.fromstring(response.read())

            # RDF/RSS 1.0
            if 'RDF' in root.tag:
                ch_title = root.find('.//{http://purl.org/rss/1.0/}channel/{http://purl.org/rss/1.0/}title')
                site_title = ch_title.text if ch_title is not None else "News"
                for item in root.findall('.//{http://purl.org/rss/1.0/}item')[:limit]:
                    t  = item.find('{http://purl.org/rss/1.0/}title')
                    l  = item.find('{http://purl.org/rss/1.0/}link')
                    d  = item.find('{http://purl.org/dc/elements/1.1/}date')
                    ds = item.find('{http://purl.org/rss/1.0/}description')
                    desc = clean_html_text(ds.text if ds is not None else "")
                    if len(desc) > 180:
                        desc = desc[:177] + "..."
                    items.append({
                        "title": t.text if t is not None else "",
                        "link":  l.text if l is not None else "",
                        "pubDate": d.text if d is not None else "",
                        "source": site_title, "image": "", "description": desc
                    })
                return items

            # RSS 2.0
            channel = root.find('channel')
            if channel is None:
                return items
            stn = channel.find('title')
            site_title = stn.text if stn is not None else "News"
            for kw in ["Yahoo", "RSS", "Feed"]:
                if kw in site_title and len(site_title) > len(kw) + 3:
                    site_title = site_title.replace(kw, "").strip(" -|:")

            for item in channel.findall('item')[:limit]:
                title    = item.find('title').text    if item.find('title')       is not None else ""
                link     = item.find('link').text     if item.find('link')        is not None else ""
                pubDate  = item.find('pubDate').text  if item.find('pubDate')     is not None else ""
                desc_raw = item.find('description').text if item.find('description') is not None else ""

                img_url    = extract_image_from_item(item)
                clean_desc = clean_html_text(desc_raw)

                if " - " in title:
                    parts = title.rsplit(" - ", 1)
                    if len(parts[1]) < 40:
                        title = parts[0].strip()

                if clean_desc.lower().startswith(title.lower()):
                    clean_desc = clean_desc[len(title):].strip().lstrip('-').strip()

                if len(clean_desc) > 180:
                    clean_desc = clean_desc[:177] + "..."

                items.append({
                    "title": title, "link": link, "pubDate": pubDate,
                    "source": site_title, "image": img_url, "description": clean_desc
                })
    except Exception as e:
        print(f"  ⚠️ Error fetching {url}: {e}")
    return items

# ─────────────────────────────────────────────────────────────
# Main Build
# ─────────────────────────────────────────────────────────────
def main():
    print(f"🌐 Multi-Lingual News Fetch — {len(LANG_FEEDS)} languages")
    print(f"📝 Translation: MyMemory API (contact: {TRANSLATE_EMAIL})\n")

    all_news = {}

    for lang, feeds in LANG_FEEDS.items():
        print(f"── [{lang.upper()}] ──────────────────────────────────────")
        all_news[lang] = {}

        for category, url in feeds.items():
            items = fetch_and_parse(url)

            # ── TRANSLATE titles + descriptions ──────────────────
            # Only needed when fetched content appears to be in English
            # and the target language is NOT English.
            if lang != "en" and items:
                translated_items = []
                for article in items:
                    # Small delay to be a good citizen to the free API
                    time.sleep(0.15)

                    new_title = translate_text(article["title"], lang)
                    new_desc  = translate_text(article["description"], lang)

                    translated_items.append({
                        **article,
                        "title":       new_title,
                        "description": new_desc
                    })
                items = translated_items
                print(f"  ✓ {category}: {len(items)} articles (translated → {lang})")
            else:
                print(f"  ✓ {category}: {len(items)} articles (native)")

            all_news[lang][category] = items

    js_content  = f"// Auto-generated multinational news — {datetime.datetime.utcnow().isoformat()}Z\n"
    js_content += f"// Languages: {', '.join(LANG_FEEDS.keys())}\n"
    js_content += f"window.NEWS_DATA = {json.dumps(all_news, indent=2, ensure_ascii=False)};\n"

    os.makedirs("NewsCommon", exist_ok=True)
    with open("NewsCommon/news_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)

    cache_hits = sum(1 for v in _translation_cache.values())
    print(f"\n✅ Done! {cache_hits} translations cached.")
    print(f"📦 Output → NewsCommon/news_data.js")

if __name__ == "__main__":
    main()
