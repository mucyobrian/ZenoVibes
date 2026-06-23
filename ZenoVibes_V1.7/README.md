# 🛍️ StillWorks — Free Local Marketplace

*Used. Cheap. Still Works.*

A fully static marketplace website you can host **100% free on GitHub Pages**.
Sellers post products → buyers contact them via Call or WhatsApp directly. No on-site checkout, ever.

> Repo name is still `ZenoVibes` on GitHub — the live site is branded **StillWorks**.

---

## 🗂️ File Structure

```
ZenoVibes/
├── index.html              ← Homepage
├── css/
│   ├── style.css           ← Main styles
│   └── components.css      ← Component styles
├── js/
│   ├── config.js           ← ⚙️ YOUR SETTINGS GO HERE
│   ├── db.js                ← Database + auth layer
│   ├── app.js                ← Shared utilities
│   └── home.js               ← Homepage logic
└── pages/
    ├── shop.html           ← Full product browser
    ├── categories.html     ← Category browser
    ├── product.html        ← Product detail page (image carousel, variants)
    ├── sell.html            ← Seller listing form + image upload
    └── account.html        ← Login / Register / Dashboard
```

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1 — Host on GitHub Pages (Free)

1. Go to [github.com](https://github.com) and create a free account
2. Click **New Repository** → name it anything (this one's called `ZenoVibes`)
3. Upload all these files (drag & drop or use GitHub Desktop)
4. Go to **Settings → Pages → Branch: main → Save**
5. Your site is live at: `https://YOUR-USERNAME.github.io/YOUR-REPO`

---

### STEP 2 — Create Google Sheet (Your Database)

1. Go to [sheets.google.com](https://sheets.google.com) → New Spreadsheet
2. Rename it "StillWorks Products"
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
2. Title: "StillWorks — Add Your Product"
3. Add these questions (Short Answer unless noted), matching the Sheet columns above:
   - Seller Name, Phone Number, WhatsApp Number, Email Address, City / District
   - GPS Latitude (optional), GPS Longitude (optional)
   - Product Name, Description (Paragraph), Price, Category, Subcategory
   - **Images JSON** (Paragraph) — receives the uploaded photo URLs + tags + prices as one JSON blob, sent automatically by the site. Sellers never see or type into this field directly.

4. Click the **Responses** tab → Link to Spreadsheet → select your StillWorks sheet
5. Copy your form URL

---

### STEP 4 — Set Up Image Uploads (Hugging Face + Cloudflare Worker)

Sellers pick photos directly from their phone or computer on the **Sell** page — no copy-pasting image links. Here's the pipeline:

```
Seller picks photo  →  Compressed in-browser (Canvas API)  →  Sent to Cloudflare Worker  →  Worker uploads to Hugging Face Dataset  →  Public image URL returned
```

This keeps your Hugging Face API token secret (it never touches the browser) while still letting the whole site stay free and static.

**To set this up yourself:**

1. Create a free [Hugging Face](https://huggingface.co) account
2. Create a new **Dataset** repo (e.g. `your-username/your-project`) — set it to **public** so image URLs are viewable
3. Generate a **Write-access** API token under Hugging Face → Settings → Access Tokens
4. Create a [Cloudflare Workers](https://workers.cloudflare.com) account (free tier)
5. Deploy a Worker that:
   - Accepts a `POST` with the image file
   - Uploads it to your Hugging Face Dataset repo using the API token
   - Returns the public image URL as JSON
6. In the Worker's **Settings → Variables**, add your Hugging Face token as a **Secret** (not a plain text variable) named `HF_TOKEN`
7. Copy your deployed Worker URL — it looks like `https://your-worker-name.your-subdomain.workers.dev`
8. Paste it into `pages/sell.html` as `UPLOAD_WORKER_URL`

Compression settings (max width/height, JPEG quality) are configurable at the top of the upload script in `sell.html`.

---

### STEP 5 — Update config.js

Open `js/config.js` and fill in:

```javascript
siteName: "StillWorks",
siteTagline: "Used. Cheap. Still Works.",
SHEET_ID: "YOUR_SHEET_ID",
SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/YOUR_ID/gviz/tq?tqx=out:json&sheet=Sheet1",
FORM_URL: "https://docs.google.com/forms/d/YOUR_FORM_ID/viewform",
LISTINGS_API_URL: "YOUR_APPS_SCRIPT_WEB_APP_URL", // used to edit/delete listings
PAID_WHATSAPP: "+250700000000",  // ← YOUR WhatsApp number for payments
```

Also update currency, city defaults, categories, etc. to fit your market.

---

### STEP 6 — Find Your Google Form Entry IDs

In `pages/sell.html`, find where the form submission is built.
Replace each `entry.XXXXXXX` placeholder with your form's real entry IDs — including the one for **Images JSON**.

**How to find entry IDs:**
1. Open your Google Form
2. Right-click → View Page Source
3. Search for `entry.` — you'll see things like `entry.1234567890`
4. Match each field to its entry ID and update the code

---

### STEP 7 — Auto-clean New Submissions (Apps Script)

New form responses land in a raw responses tab. An Apps Script `onFormSubmit` trigger copies them into a clean `Sheet1` tab, auto-generating an `id` and setting `status: 'active'` — listings go live immediately, with no manual approval step.

A second Apps Script Web App (deployed separately, its URL is `LISTINGS_API_URL` in config) handles editing and deleting listings directly from the seller's "My Listings" dashboard.

---

## 💰 PRICING MODEL (How You Earn)

| Plan | Listings | Price |
|------|----------|-------|
| Free | 30/month | Free |
| Paid | +30/month | RWF 2,000 |

Sellers who hit the limit contact you via WhatsApp to pay.
You manually update their `plan` field in the Google Sheet to `paid`.

---

## ✅ FEATURES INCLUDED

- ✅ Homepage with featured products
- ✅ Full shop page with infinite scroll
- ✅ **Full product detail page** with swipeable image carousel (up to 5 photos)
- ✅ **Real photo uploads** — sellers pick straight from phone/computer, no copy-pasting links
- ✅ **Automatic client-side compression** before upload (fast, low-bandwidth friendly)
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
- ✅ My Listings dashboard (edit/delete via Apps Script Web App)
- ✅ Monthly listing limit (30 free, pay for more)
- ✅ Google Sheets as database
- ✅ Google Forms for new submissions
- ✅ 100% static — works on GitHub Pages free
- ✅ Mobile-first responsive design
- ✅ Plain system font (no stylized fonts loaded — faster + simpler)
- ✅ Tab bar navigation (Home / Categories / Shop / Account)

---

## 🖼️ HOW MULTI-IMAGE & VARIANT TAGS WORK

Each product stores an `images` array instead of a single `imageUrl`:

```json
"images": [
  { "url": "https://huggingface.co/datasets/your-username/your-project/resolve/main/red-shirt.jpg", "tag": "Red — Size M", "price": 15000 },
  { "url": "https://huggingface.co/datasets/your-username/your-project/resolve/main/blue-shirt.jpg", "tag": "Blue — Size L", "price": 16000 }
]
```

- `tag` is optional — leave it blank if the photo is just another angle of the same item.
- `price` is optional — if left out, it falls back to the product's base price.
- On the seller's **Sell** page, each photo slot uploads automatically as soon as it's picked — compress → upload → get back a public URL. Up to 5 slots, each with its own optional tag and price.
- On the buyer's product detail page, photos appear in a swipeable carousel. If any photo has a tag, buttons appear below the price ("Red — Size M", "Blue — Size L") — tapping one jumps the carousel to that photo and updates the displayed price.
- When the listing is submitted, the whole `images` array is JSON-encoded into a single form field (and Sheet column) called `imagesJson` (Google Forms can't handle repeating field groups). The site automatically `JSON.parse()`s it back out when displaying.

If you're hand-editing the Google Sheet directly, just paste valid JSON into that column, matching the example above.

---

## 🆓 100% FREE STACK

| Service | What For | Cost |
|---------|----------|------|
| GitHub Pages | Website hosting | FREE |
| Google Sheets | Product database | FREE |
| Google Forms | Seller submissions | FREE |
| Google Apps Script | Listing sync + edit/delete API | FREE |
| Hugging Face Datasets | Image storage | FREE |
| Cloudflare Workers | Upload proxy (keeps API token secret) | FREE |
| WhatsApp | Buyer-seller contact | FREE |

**Total monthly cost: RWF 0** 🎉
