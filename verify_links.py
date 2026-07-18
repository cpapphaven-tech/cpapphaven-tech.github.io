#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
BLOG_DIR = BASE_DIR / "blog"
SITEMAP_PATH = BASE_DIR / "sitemap.xml"

def verify_blog_pages():
    print("=== Verification of Blog Pages ===")
    
    if not BLOG_DIR.exists():
        print("❌ Error: blog/ directory does not exist.")
        return False
        
    html_files = list(BLOG_DIR.glob("*.html"))
    if not html_files:
        print("❌ Error: No HTML files found in blog/ directory.")
        return False
        
    print(f"Found {len(html_files)} HTML pages in blog/ directory.")
    
    # We expect about 82 files (81 game articles + 1 index.html)
    errors = 0
    warnings = 0
    
    for p in html_files:
        if p.name == "index.html":
            continue
            
        with open(p, "r", encoding="utf-8") as f:
            content = f.read()
            
        # 1. Check title
        if not re.search(r'<title>.*?</title>', content, re.IGNORECASE):
            print(f"❌ Error in {p.name}: Missing <title> tag")
            errors += 1
            
        # 2. Check meta description
        if not re.search(r'<meta[^>]*name=["\']description["\'][^>]*>', content, re.IGNORECASE):
            print(f"❌ Error in {p.name}: Missing meta description")
            errors += 1
            
        # 3. Check canonical URL
        canonical = re.search(r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\'](.*?)["\']', content, re.IGNORECASE)
        if not canonical:
            print(f"❌ Error in {p.name}: Missing canonical URL")
            errors += 1
        else:
            expected_canonical = f"https://playmixgames.in/blog/{p.stem}.html"
            if canonical.group(1) != expected_canonical:
                print(f"❌ Error in {p.name}: Canonical URL mismatch. Expected: {expected_canonical}, Got: {canonical.group(1)}")
                errors += 1
                
        # 4. Check schemas
        if content.count('application/ld+json') < 2:
            print(f"⚠️  Warning in {p.name}: Less than 2 JSON-LD schemas detected (Article + Breadcrumb expected)")
            warnings += 1
            
        # 5. Check Play Hero Box at the top
        if "play-hero-box" not in content:
            print(f"❌ Error in {p.name}: Missing 'play-hero-box' at the top")
            errors += 1
            
        # 6. Check Adsterra slot
        if "container-63208462c4f9ec6018b4ea2e1903489d" not in content:
            print(f"❌ Error in {p.name}: Missing Adsterra ad container")
            errors += 1
            
        # 7. Check related section
        if "related-section" not in content:
            print(f"❌ Error in {p.name}: Missing related games section")
            errors += 1
            
        # 8. Check ads.js and analytics.js
        if "ads.js" not in content:
            print(f"❌ Error in {p.name}: Missing ads.js script reference")
            errors += 1
        if "analytics.js" not in content:
            print(f"❌ Error in {p.name}: Missing analytics.js script reference")
            errors += 1

    # Check blog index.html
    index_file = BLOG_DIR / "index.html"
    if not index_file.exists():
        print("❌ Error: blog/index.html is missing.")
        errors += 1
    else:
        with open(index_file, "r", encoding="utf-8") as f:
            index_content = f.read()
        if "blog-grid" not in index_content:
            print("❌ Error in blog/index.html: Missing blog-grid container")
            errors += 1
            
    # Check sitemap
    if not SITEMAP_PATH.exists():
        print("❌ Error: sitemap.xml is missing.")
        errors += 1
    else:
        with open(SITEMAP_PATH, "r", encoding="utf-8") as f:
            sitemap_content = f.read()
        for p in html_files:
            url = f"https://playmixgames.in/blog/{p.name}"
            if url not in sitemap_content:
                print(f"⚠️  Warning: {url} is missing from sitemap.xml")
                warnings += 1
                
    print(f"\nVerification finished: {errors} Errors, {warnings} Warnings.")
    return errors == 0

if __name__ == "__main__":
    success = verify_blog_pages()
    sys.exit(0 if success else 1)
