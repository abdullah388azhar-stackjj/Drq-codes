# ScanList - QR Product Scanner

A web app with a built-in camera QR scanner. Scan product QR codes and ScanList builds your item list with quantities and a total. No scanner hardware needed.

## Files
- `index.html` - the page
- `css/style.css` - styles
- `js/app.js` - scanner, list and QR generator logic

## Deploy on GitHub Pages
1. Create a new **public** repository on GitHub.
2. Upload the **contents** of this folder (not the folder itself) so `index.html` sits in the repository root.
3. Go to **Settings -> Pages**. Under "Build and deployment" choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After 1-5 minutes your app is live at `https://<username>.github.io/<repo-name>/`.

## Notes
- The camera only works over https (GitHub Pages is https) or on localhost.
- Libraries (jsQR, qrcodejs) load from cdnjs, so an internet connection is needed.
- Scanned lists are saved in the browser's localStorage on each device.
