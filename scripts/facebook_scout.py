import os
import sys
import json
import time
import urllib.parse
import argparse
from datetime import datetime
from playwright.sync_api import sync_playwright

DEFAULT_QUERIES = [
    "free browser games",
    "web game recommendations",
    "unblocked games free",
    "addictive browser games"
]

def main():
    parser = argparse.ArgumentParser(description="Facebook Social Listening Scout for Playmix")
    parser.add_argument("--session-file", default="facebook_session.json", help="Path to save/load Facebook session state")
    parser.add_argument("--login", action="store_true", help="Force headful login to save session")
    parser.add_argument("--queries", default=",".join(DEFAULT_QUERIES), help="Comma-separated search queries")
    parser.add_argument("--limit", type=int, default=10, help="Max posts per query")
    parser.add_argument("--output", default="scouted_posts.json", help="Output file path for parsed posts")
    args = parser.parse_args()

    queries = [q.strip() for q in args.queries.split(",") if q.strip()]

    # If login is requested or session file doesn't exist, launch headful for login
    if args.login or not os.path.exists(args.session_file):
        print(f"[*] Session file '{args.session_file}' not found or login forced.")
        print("[*] Launching headful browser for login...")
        with sync_playwright() as p:
            browser = p.firefox.launch(headless=False)
            context = browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0"
            )
            page = context.new_page()
            page.goto("https://www.facebook.com")
            
            print("\n======================================================================")
            print("👉 PLEASE LOG IN TO FACEBOOK IN THE OPENED BROWSER WINDOW.")
            print("👉 AFTER SUCCESSFUL LOGIN, RETURN TO THIS TERMINAL AND PRESS ENTER.")
            print("======================================================================\n")
            
            input("Press Enter once you have logged in to Facebook and the feed has loaded...")
            
            context.storage_state(path=args.session_file)
            print(f"[*] Session state successfully saved to '{args.session_file}'")
            browser.close()
        return

    # Run headless scraping
    print(f"[*] Starting background scraping using session: {args.session_file}")
    scouted_data = {}
    total_found = 0

    with sync_playwright() as p:
        browser = p.firefox.launch(headless=True)
        try:
            context = browser.new_context(
                storage_state=args.session_file,
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0"
            )
            page = context.new_page()

            for query in queries:
                print(f"[*] Scouting for query: '{query}'...")
                encoded_query = urllib.parse.quote(query)
                search_url = f"https://www.facebook.com/search/posts/?q={encoded_query}"
                
                page.goto(search_url)
                # Wait for feed to load (timeout 5s max)
                try:
                    page.wait_for_timeout(5000)
                except Exception:
                    pass

                # Scroll down to trigger lazy loading of posts
                for scroll in range(3):
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    time.sleep(2)

                # Extract posts using robust javascript executor
                posts = page.evaluate("""
                    () => {
                        const results = [];
                        const links = Array.from(document.querySelectorAll('a'));
                        
                        // Extract unique links that look like posts or permalinks
                        const postLinks = links.filter(a => {
                            const href = a.href || '';
                            return (href.includes('/posts/') || href.includes('/permalink/') || href.includes('permalink.php') || (href.includes('/groups/') && href.includes('/posts/')));
                        });
                        
                        const seenLinks = new Set();
                        for (const a of postLinks) {
                            let href = a.href;
                            try {
                                const url = new URL(href);
                                url.searchParams.delete('__cft__');
                                url.searchParams.delete('__tn__');
                                href = url.toString();
                            } catch(e) {}
                            
                            if (seenLinks.has(href)) continue;
                            seenLinks.add(href);
                            
                            // Find the container article / role="article"
                            let parent = a.parentElement;
                            let article = null;
                            for (let i = 0; i < 15; i++) {
                                if (!parent) break;
                                if (parent.getAttribute('role') === 'article' || parent.tagName === 'ARTICLE') {
                                    article = parent;
                                    break;
                                }
                                parent = parent.parentElement;
                            }
                            
                            if (article) {
                                results.push({
                                    url: href,
                                    text: article.innerText
                                });
                            } else {
                                results.push({
                                    url: href,
                                    text: a.closest('div')?.innerText || ''
                                });
                            }
                        }
                        return results;
                    }
                """)

                # Filter and clean up results
                query_posts = []
                for post in posts:
                    text = post.get("text", "").strip()
                    url = post.get("url", "")
                    
                    if not text or len(text) < 15:
                        continue
                        
                    # Skip sponsored posts/ads
                    if "Sponsored" in text:
                        continue
                        
                    # Skip if already in list
                    if any(p["url"] == url for p in query_posts):
                        continue

                    # Basic relevance check: text should contain some game-related words
                    # to filter out unrelated noise Facebook search might return
                    keywords = ["game", "play", "suggest", "recommend", "browser", "unblocked", "online", "fun", "addictive"]
                    if not any(kw in text.lower() for kw in keywords):
                        continue

                    query_posts.append({
                        "url": url,
                        "text": text,
                        "scouted_at": datetime.now().isoformat()
                    })

                    if len(query_posts) >= args.limit:
                        break

                scouted_data[query] = query_posts
                total_found += len(query_posts)
                print(f"[+] Found {len(query_posts)} posts for query '{query}'")

        except Exception as e:
            print(f"[!] Error during scraping: {e}")
        finally:
            browser.close()

    # Save findings
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(scouted_data, f, indent=2, ensure_ascii=False)

    print(f"[*] Scouting complete. Total posts saved: {total_found} to '{args.output}'")

if __name__ == "__main__":
    main()
