# 🛍️ SokoHub — Free Local Marketplace

A fully static marketplace website you can host **100% free on GitHub Pages**.  
Sellers post products → buyers contact them via Call or WhatsApp directly.

---

## 🗂️ File Structure

```
sokohub/
├── index.html              ← Homepage
├── css/
│   ├── style.css           ← Main styles
│   └── components.css      ← Component styles
├── js/
│   ├── config.js           ← ⚙️ YOUR SETTINGS GO HERE
│   ├── db.js               ← Database + auth layer
│   ├── app.js              ← Shared utilities
│   └── home.js             ← Homepage logic
└── pages/
    ├── shop.html           ← Full product browser
    ├── categories.html     ← Category browser
    ├── sell.html           ← Seller listing form
    └── account.html        ← Login / Register / Dashboard
```

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1 — Host on GitHub Pages (Free)

1. Go to [github.com](https://github.com) and create a free account
2. Click **New Repository** → name it `sokohub` (or any name)
3. Upload all these files (drag & drop or use GitHub Desktop)
4. Go to **Settings → Pages → Branch: main → Save**
5. Your site is live at: `https://YOUR-USERNAME.github.io/sokohub`

---

### STEP 2 — Create Google Sheet (Your Database)

1. Go to [sheets.google.com](https://sheets.google.com) → New Spreadsheet
2. Rename it "SokoHub Products"
3. Add these column headers in Row 1 (exactly as written):

```
id | timestamp | sellerName | sellerPhone | sellerWhatsApp | sellerEmail | sellerCity | sellerLat | sellerLng | productName | description | price | category | subcategory | imagesJson | status
```

Note: `imagesJson` holds ALL photos for that product (with tags and per-photo prices) as one JSON text value — not a separate column per photo.

4. Go to **File → Share → Publish to the web**
5. Choose **Sheet1** and **JSON** format → Click **Publish**
6. Copy the URL — it looks like:  
   `https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:json`

---

### STEP 3 — Create Google Form (How sellers submit products)

1. Go to [forms.google.com](https://forms.google.com) → New Form
2. Title: "SokoHub — Add Your Product"
3. Add these questions (Short Answer unless noted):
   - Seller Name
   - Phone Number
   - WhatsApp Number
   - Email Address
   - City / District
   - GPS Latitude (optional)
   - GPS Longitude (optional)
   - Product Name
   - Description (Paragraph)
   - Price (RWF)
   - Category (Dropdown — use your categories)
   - Subcategory
   - **Images JSON** (Paragraph — this single field receives all 5 photo URLs + tags + prices as one JSON blob, sent automatically by the website; sellers never see or type into this field directly)

4. Click the **Responses** tab → Link to Spreadsheet → Select your SokoHub sheet
5. Copy your form URL

---

### STEP 4 — Update config.js

Open `js/config.js` and fill in:

```javascript
SHEET_ID: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/YOUR_ID/gviz/tq?tqx=out:json&sheet=Sheet1",
FORM_URL: "https://docs.google.com/forms/d/YOUR_FORM_ID/viewform",
PAID_WHATSAPP: "+250700000000",  // ← YOUR WhatsApp number for payments
```

Also update your site name, currency, city defaults, etc.

---

### STEP 5 — Find Your Google Form Entry IDs

In `pages/sell.html`, find the `sendToGoogleForm()` function.  
You need to replace `entry.SELLER_NAME` etc. with your form's real entry IDs — including `entry.IMAGES_JSON` for the photos field.

**How to find entry IDs:**
1. Open your Google Form
2. Right-click → View Page Source
3. Search for `entry.` — you'll see things like `entry.1234567890`
4. Match each field to its entry ID and update the code

---

### STEP 6 — Auto-sync Database (Optional Automation)

To automatically push new submissions from Google Sheets to GitHub:

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Paste this code:

```javascript
function syncToGitHub() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const data  = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows    = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  const token  = 'YOUR_GITHUB_TOKEN'; // Create at github.com/settings/tokens
  const owner  = 'YOUR_GITHUB_USERNAME';
  const repo   = 'sokohub';
  const path   = 'js/products.json';

  // Get current file SHA
  const getRes = UrlFetchApp.fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: { Authorization: `token ${token}` } }
  );
  const sha = JSON.parse(getRes.getContentText()).sha;

  // Push updated JSON
  UrlFetchApp.fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        message: 'Auto-sync products from Google Sheets',
        content: Utilities.base64Encode(JSON.stringify(rows, null, 2)),
        sha: sha
      })
    }
  );
}

// Run every 30 minutes automatically
function setupTrigger() {
  ScriptApp.newTrigger('syncToGitHub').timeBased().everyMinutes(30).create();
}
```

3. Run `setupTrigger()` once to enable automatic syncing every 30 minutes!

---

## 💰 PRICING MODEL (How You Earn)

| Plan | Listings | Price |
|------|----------|-------|
| Free | 30/month | Free |
| Paid | +30/month | RWF 2,000 |

Sellers who hit the limit contact you via WhatsApp to pay.  
You manually update their `plan` field in the Google Sheet to `paid`.

---

## 🖼️ FREE IMAGE HOSTING FOR SELLERS

Tell sellers to use these free image hosts:
- **[imgbb.com](https://imgbb.com)** — Upload → Copy direct link
- **[postimages.org](https://postimages.org)** — No account needed
- **[cloudinary.com](https://cloudinary.com)** — 25GB free

---

## ✅ FEATURES INCLUDED

- ✅ Homepage with featured products
- ✅ Full shop page with infinite scroll
- ✅ **Full product detail page** with swipeable image carousel (up to 5 photos)
- ✅ **Multi-image upload** (sellers add up to 5 photos per product)
- ✅ **Variant tags per image** (Color, Size, or custom) with optional per-tag pricing
- ✅ Filter by Category (Electronics, Fashion, Food, etc.)
- ✅ Filter by Price Range (min/max)
- ✅ Sort by Newest / Price / Near Me
- ✅ Near Me filter using GPS
- ✅ **Seller location shown on every product** — city/area text + "View on Google Maps" link
- ✅ Call Seller button (tel: link)
- ✅ WhatsApp Seller button (wa.me link with pre-filled message, includes selected variant)
- ✅ Categories page with product counts
- ✅ Seller account (register/login via localStorage)
- ✅ My Listings dashboard
- ✅ Monthly listing limit (30 free, pay for more)
- ✅ Google Sheets as database
- ✅ Google Forms for new submissions
- ✅ 100% static — works on GitHub Pages free
- ✅ Mobile-first responsive design
- ✅ Plain system font (no stylized fonts loaded — faster + simpler)
- ✅ Tab bar navigation (Home / Categories / Shop / Account)

---

## 🖼️ HOW MULTI-IMAGE & VARIANT TAGS WORK

Each product now stores an `images` array instead of a single `imageUrl`:

```json
"images": [
  { "url": "https://i.ibb.co/abc123/red-shirt.jpg", "tag": "Red — Size M", "price": 15000 },
  { "url": "https://i.ibb.co/def456/blue-shirt.jpg", "tag": "Blue — Size L", "price": 16000 }
]
```

- `tag` is optional — leave it blank if the photo is just another angle of the same item.
- `price` is optional — if left out, it falls back to the product's base price.
- On the seller's "Sell" form, each photo gets its own row with a URL field, a tag field, and a price field. Up to 5 rows.
- On the buyer's product detail page, photos appear in a swipeable carousel. If any photo has a tag, buttons appear below the price ("Red — Size M", "Blue — Size L") — tapping one jumps the carousel to that photo and updates the displayed price.
- When sent to your Google Sheet via the Form, the whole `images` array is JSON-encoded into a single column called `IMAGES_JSON` (since Google Forms can't handle repeating field groups). The site automatically `JSON.parse()`s it back out when displaying.

If you're hand-editing the Google Sheet directly, just paste valid JSON into that column, exactly like the example above.

---

## 🆓 100% FREE STACK

| Service | What For | Cost |
|---------|----------|------|
| GitHub Pages | Website hosting | FREE |
| Google Sheets | Product database | FREE |
| Google Forms | Seller submissions | FREE |
| Google Apps Script | Auto-sync | FREE |
| imgbb.com | Image hosting | FREE |
| WhatsApp | Buyer-seller contact | FREE |

**Total monthly cost: RWF 0** 🎉
