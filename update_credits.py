import os

base_dir = "/Users/gauravpurohit/Documents/GP/Playmix"
games = ["FruitSplash", "GemMatch", "CandyBlast", "PetPop", "VeggieSmash"]

credits_text = """            <h2 style="color:#fff; margin-top:20px;">Credits</h2>
            <p style="font-size: 0.9em; color: #777;">
                This game is an adaptation. The core mechanics are based on the open-source "Candy Crush Game" by Talha Bin Yousaf under the <a href="https://opensource.org/license/mit" style="color:#4facfe;" target="_blank">MIT License</a>. Modified and styled by PlayMix Games to feature a responsive, mobile-optimized experience with a completely new visual theme.
            </p>"""

old_footer = """    <footer style="text-align: center; padding: 20px; background: #050510; color: #666; font-size: 0.9rem;">
        &copy; 2026 PlayMix Games. All rights reserved. <a href="../privacy.html" style="color: #4facfe;">Privacy</a> | <a href="../terms.html" style="color: #4facfe;">Terms</a>
    </footer>"""

new_footer = """    <footer style="text-align: center; padding: 20px; background: #050510; color: #666; font-size: 0.9rem;">
        &copy; 2026 PlayMix Games. All rights reserved. <a href="../privacy.html" style="color: #4facfe;">Privacy</a> | <a href="../terms.html" style="color: #4facfe;">Terms</a> | <a href="../licenses.html" style="color: #4facfe;">Licenses</a>
    </footer>"""

for game in games:
    index_path = os.path.join(base_dir, game, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r") as f:
            content = f.read()
        
        # Remove credits
        content = content.replace(credits_text, "")
        
        # Update footer
        content = content.replace(old_footer, new_footer)
        
        # Also remove the Talha mention in start screen to keep it fully clean if desired:
        talha_mention = """<p style="font-size: 0.8rem; margin-top: 20px; color: #888;">Based on game by Talha Bin Yousaf (MIT License)</p>"""
        content = content.replace(talha_mention, "")
        
        with open(index_path, "w") as f:
            f.write(content)
        print(f"Updated {game}")
