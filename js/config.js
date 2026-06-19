// ================================================
// SOKOHUB CONFIG — Edit these values to connect
// your Google Sheets database
// ================================================

const CONFIG = {
  // ── SITE INFO ──────────────────────────────────
  siteName: "SokoHub",
  siteTagline: "Rwanda's Free Local Marketplace",
  currency: "RWF",
  currencySymbol: "RWF",

  // ── GOOGLE SHEETS DATABASE ─────────────────────
  SHEET_ID: "1YVGwMNkJNbtJI8OEw6Q5YGUU0UG7gcfoqfxsDHEJdGo",
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/1YVGwMNkJNbtJI8OEw6Q5YGUU0UG7gcfoqfxsDHEJdGo/gviz/tq?tqx=out:json&sheet=Sheet1",
  FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSdeLKmDBXQjpEKYlzV8sVWMvBzWOE201oFUrFTMr6vxQ0_S_w/viewform",

  // ── APPS SCRIPT WEB APP (for edit/delete) ──────
  // Paste your /exec URL here after deploying the Web App
  // It looks like: https://script.google.com/macros/s/XXXXX/exec
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzrC7pwuGmnAVq8nZdt2cGZRugwv4MwHMoyydgM1RmluOVRlWjZ6FNmgzBy9lBqnWjeEw/exec",

  // ── SELLER LIMITS ──────────────────────────────
  FREE_LIMIT: 30,           // free products per month
  PAID_EXTRA: 30,           // extra products when paid
  PAID_PRICE: 2000,         // price in RWF for 30 more
  PAID_WHATSAPP: "+250700000000", // your WhatsApp for payment

  // ── LOCATION ──────────────────────────────────
  DEFAULT_CITY: "Kigali",
  DEFAULT_LAT: -1.9441,
  DEFAULT_LNG: 30.0619,
  NEAR_RADIUS_KM: 20,       // km for "Near Me" filter

  // ── CATEGORIES ────────────────────────────────
  CATEGORIES: [
    { id: "all",          label: "All",           emoji: "🛍️" },
    { id: "electronics",  label: "Electronics",   emoji: "📱" },
    { id: "fashion",      label: "Fashion",       emoji: "👗" },
    { id: "accessories",  label: "Accessories",   emoji: "💍" },
    { id: "food",         label: "Food & Drinks", emoji: "🍔" },
    { id: "furniture",    label: "Furniture",     emoji: "🛋️" },
    { id: "vehicles",     label: "Vehicles",      emoji: "🚗" },
    { id: "health",       label: "Health & Beauty", emoji: "💄" },
    { id: "sports",       label: "Sports",        emoji: "⚽" },
    { id: "books",        label: "Books & Stationery", emoji: "📚" },
    { id: "agriculture",  label: "Agriculture",   emoji: "🌾" },
    { id: "services",     label: "Services",      emoji: "🔧" },
    { id: "property",     label: "Property",      emoji: "🏠" },
    { id: "babies",       label: "Baby & Kids",   emoji: "🍼" },
    { id: "other",        label: "Other",         emoji: "📦" },
  ],

  // ── SUBCATEGORIES ─────────────────────────────
  SUBCATEGORIES: {
    electronics:  ["Phones", "Laptops", "Tablets", "TVs", "Cameras", "Audio", "Accessories"],
    fashion:      ["Men's Clothing", "Women's Clothing", "Shoes", "Bags", "Jewelry", "Watches"],
    accessories:  ["Jewelry", "Belts", "Sunglasses", "Hats", "Scarves"],
    food:         ["Fresh Produce", "Packaged Food", "Beverages", "Snacks", "Homemade"],
    furniture:    ["Sofas", "Beds", "Tables", "Chairs", "Storage", "Decor"],
    vehicles:     ["Cars", "Motorcycles", "Bicycles", "Trucks", "Parts"],
    health:       ["Skincare", "Makeup", "Hair Care", "Supplements", "Medical"],
    sports:       ["Football", "Basketball", "Gym Equipment", "Outdoor", "Cycling"],
    books:        ["Textbooks", "Novels", "Magazines", "Stationery", "Arts & Crafts"],
    agriculture:  ["Seeds", "Tools", "Livestock", "Fertilizers", "Produce"],
    services:     ["Plumbing", "Electrical", "Cleaning", "Tutoring", "Photography"],
    property:     ["For Rent", "For Sale", "Land", "Office Space"],
    babies:       ["Clothing", "Toys", "Feeding", "Strollers", "Safety"],
    other:        ["Miscellaneous"],
  },

  // ── SAMPLE/DEMO DATA (used when Sheet not connected) ──
  DEMO_PRODUCTS: [
    {
      id: "demo_001",
      sellerName: "Jean Pierre",
      sellerPhone: "+250781234567",
      sellerWhatsApp: "+250781234567",
      sellerCity: "Kigali, Kicukiro",
      sellerLat: -1.9506,
      sellerLng: 30.0588,
      productName: "Samsung Galaxy A54",
      description: "Brand new sealed Samsung Galaxy A54 5G. 128GB storage, 6GB RAM. Original receipt included.",
      price: 380000,
      category: "electronics",
      subcategory: "Phones",
      images: [
        { url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600", tag: "Black — 128GB", price: 380000 },
        { url: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=600", tag: "Silver — 128GB", price: 380000 },
        { url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600", tag: "Black — 256GB", price: 430000 },
      ],
      timestamp: new Date().toISOString(),
    },
    {
      id: "demo_002",
      sellerName: "Marie Claire",
      sellerPhone: "+250782345678",
      sellerWhatsApp: "+250782345678",
      sellerCity: "Kigali, Kimironko",
      sellerLat: -1.9400,
      sellerLng: 30.0619,
      productName: "Elegant Ankara Dress",
      description: "Beautiful hand-crafted Ankara dress. Perfect for parties and events. Made to order with quality fabric.",
      price: 35000,
      category: "fashion",
      subcategory: "Women's Clothing",
      images: [
        { url: "https://images.unsplash.com/photo-1594938298603-c8148c4b4def?w=600", tag: "Size M", price: 35000 },
        { url: "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600", tag: "Size L", price: 38000 },
        { url: "https://images.unsplash.com/photo-1551803091-e20673f15770?w=600", tag: "Size XL", price: 40000 },
      ],
      timestamp: new Date().toISOString(),
    },
    {
      id: "demo_003",
      sellerName: "Patrick Mugisha",
      sellerPhone: "+250783456789",
      sellerWhatsApp: "+250783456789",
      sellerCity: "Musanze",
      sellerLat: -1.4986,
      sellerLng: 29.6354,
      productName: "Fresh Farm Avocados",
      description: "Fresh organic avocados from my farm in Musanze. Very fresh, harvested this week. Wholesale crates also available.",
      price: 12000,
      category: "food",
      subcategory: "Fresh Produce",
      images: [
        { url: "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=600", tag: "1 Crate (50pcs)", price: 12000 },
        { url: "https://images.unsplash.com/photo-1601039641847-7857b994d704?w=600", tag: "Half Crate (25pcs)", price: 7000 },
      ],
      timestamp: new Date().toISOString(),
    },
    {
      id: "demo_004",
      sellerName: "Alice Uwimana",
      sellerPhone: "+250784567890",
      sellerWhatsApp: "+250784567890",
      sellerCity: "Kigali, Remera",
      sellerLat: -1.9650,
      sellerLng: 30.1040,
      productName: "HP Laptop 15-inch",
      description: "HP laptop, Core i5 10th gen, 8GB RAM, 256GB SSD. Windows 11 installed. Good condition, barely used.",
      price: 550000,
      category: "electronics",
      subcategory: "Laptops",
      images: [
        { url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600", tag: "", price: 550000 },
        { url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600", tag: "", price: 550000 },
      ],
      timestamp: new Date().toISOString(),
    },
    {
      id: "demo_005",
      sellerName: "Emmanuel Habimana",
      sellerPhone: "+250785678901",
      sellerWhatsApp: "+250785678901",
      sellerCity: "Huye",
      sellerLat: -2.5963,
      sellerLng: 29.7396,
      productName: "Wooden Dining Table Set",
      description: "Handcrafted mahogany dining table. Local craftsmanship. Delivery available in Huye.",
      price: 280000,
      category: "furniture",
      subcategory: "Tables",
      images: [
        { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600", tag: "4 Chairs", price: 280000 },
        { url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600", tag: "6 Chairs", price: 340000 },
      ],
      timestamp: new Date().toISOString(),
    },
  ],
};
