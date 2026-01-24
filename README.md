# How to Deploy Stack 3D to GitHub Pages

There are two main ways to deploy this game. Choose the one that fits your workflow:

## Option 1: Manual Upload (Easiest)
1.  **Create a Repository**: Go to [github.com/new](https://github.com/new) and name it `stack-3d`. Keep it **Public**.
2.  **Upload Files**:
    - Click the "uploading an existing file" link.
    - Drag and drop all files from your `/Users/gauravpurohit/Documents/Test/StackPWA` folder.
    - Click **Commit changes**.
3.  **Enable Pages**:
    - Go to **Settings** -> **Pages**.
    - Set Source to **Deploy from a branch**.
    - Select `main` branch and `/ (root)` folder. Click **Save**.

## Option 2: Using Terminal (Professional)
If you have Git installed, run these commands inside the `StackPWA` folder:

```bash
git init
git add .
git commit -m "Initial stack game commit"
git branch -M main
git remote add origin https://github.com/[your-username]/stack-3d.git
git push -u origin main
```

## How to Install as a PWA
Once live at `https://[your-username].github.io/stack-3d/`:
- **iOS (Safari)**: Tap **Share** -> **Add to Home Screen**.
- **Android (Chrome)**: Tap **Settings (three dots)** -> **Install App**.
