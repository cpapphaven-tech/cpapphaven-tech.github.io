import os
import sys
import time
from playwright.sync_api import sync_playwright

def main():
    if not os.path.exists("facebook_session.json"):
        print("Error: facebook_session.json not found.")
        sys.exit(1)

    print("[*] Launching headless browser to debug Facebook search...")
    with sync_playwright() as p:
        browser = p.firefox.launch(headless=True)
        context = browser.new_context(
            storage_state="facebook_session.json",
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0"
        )
        page = context.new_page()
        
        url = "https://www.facebook.com/search/posts/?q=free%20browser%20games"
        print(f"[*] Navigating to: {url}")
        page.goto(url)
        
        print("[*] Waiting 10 seconds for content to render...")
        time.sleep(10)
        
        # Save screenshot
        screenshot_path = "facebook_search.png"
        page.screenshot(path=screenshot_path)
        print(f"[+] Screenshot saved to '{screenshot_path}'")
        
        # Extract links
        links = page.evaluate("""
            () => {
                return Array.from(document.querySelectorAll('a')).map(a => ({
                    href: a.href,
                    text: a.innerText
                })).filter(item => item.href);
            }
        """)
        
        print(f"[+] Found {len(links)} total links on page.")
        print("\n--- SAMPLE LINKS (first 30) ---")
        for i, item in enumerate(links[:30]):
            print(f"{i+1}. Text: '{item['text'].strip()}' | Href: {item['href']}")
            
        # Check for role="article" or "feed"
        articles = page.evaluate("""
            () => {
                return Array.from(document.querySelectorAll('[role="article"], article')).map(el => el.innerText.substring(0, 100));
            }
        """)
        print(f"\n[+] Found {len(articles)} article elements.")
        for i, text in enumerate(articles[:10]):
            print(f"Article {i+1}: {repr(text)}")
            
        browser.close()

if __name__ == "__main__":
    main()
