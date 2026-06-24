// ================================================
// SUBCATEGORY IMAGES — one entry per subcategory thumbnail
// ================================================
//
// Kept separate from config.js on purpose: this file holds 250+ entries,
// so it only needs to be opened when you are specifically working on
// subcategory photos — not every time you touch config.js.
//
// Every path below currently points at the same placeholder file:
//   images/subcategories/SUBCTEST.jpg
//
// HOW TO SWAP IN A REAL PHOTO:
// 1. Put your real image in /images/subcategories/ (any filename you like)
// 2. Replace just that one line's filename below — nothing else changes.
// 3. If a path 404s (missing file / typo), the UI falls back to the
//    category image, then to an emoji — see getSubcatImage() in app.js.
//
// Keys are "categoryId:Subcategory Label" and MUST exactly match the
// labels in CONFIG.SUBCATEGORIES (config.js). This file was generated
// from that exact list, so don't rename a subcategory in config.js
// without updating its key here too.

const SUBCAT_BASE = location.pathname.includes('/pages/')
  ? '../images/subcategories/'
  : 'images/subcategories/';

const SUBCAT_IMAGES = {
  // ── clothing ──
  'clothing:Dresses': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Tops & Tees': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Shirts & Blouses': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Pants & Jeans': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Shorts': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Suits & Blazers': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Coats & Jackets': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Hoodies & Sweatshirts': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Sweaters': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Swimwear': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Underwear & Intimates': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Sleepwear': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Active & Tracksuits': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Leggings': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Socks & Hosiery': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Africa Wear': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Muslim Fashion': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Wedding Dresses': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Wedding Suits & Gowns': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Flower Girl Dresses': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'clothing:Bridal Accessories': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── shoes ──
  'shoes:Sneakers': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'shoes:Sandals & Flip Flops': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'shoes:Boots': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'shoes:Loafers': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'shoes:Business Shoes': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'shoes:Canvas Shoes': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'shoes:Slippers': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'shoes:Shoe Accessories': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'shoes:Other Shoes': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── jewelry ──
  'jewelry:Quartz Watches': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Digital Watches': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Mechanical Watches': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Earrings': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Necklaces': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Rings': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Bracelets': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Jewelry Sets': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Anklets': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Body Jewelry': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Children\'s Watches': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Hair Jewelry': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Cufflinks & Tie Clips': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'jewelry:Other Watches & Jewelry': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── accessories ──
  'accessories:Shoulder Bags': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Handbags': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Cross Body Bags': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Backpacks': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Wallets': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Clutches': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Briefcases': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Waist Packs': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Travel Bags': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Kids\' Bags': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Sunglasses': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Hats & Caps': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Belts': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Scarves & Wraps': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Gloves & Mittens': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'accessories:Ties': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── kids ──
  'kids:Kids\' Clothing': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Kids\' Shoes': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Baby Clothing & Sets': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Baby Shoes': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Baby Care': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Feeding': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Strollers & Gear': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Maternity': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Bedding': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Safety': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Learning Toys': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Classic Toys': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Building & Model Toys': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Dolls': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Puzzles': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Outdoor Play': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Remote Control Toys': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'kids:Baby Toys': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── home ──
  'home:Kitchenware': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Bedding & Textiles': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Curtains & Carpets': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Decor & Wall Art': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Clocks': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Lighting': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Storage & Organization': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Cleaning Supplies': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Bathroom': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Kitchen Appliances': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Air Conditioning': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Personal Care Appliances': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Laundry Appliances': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'home:Sewing & Craft': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── beauty ──
  'beauty:Makeup': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Skin Care': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Hair Care': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Nail Art': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Bath & Shower': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Shaving & Hair Removal': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Tattoo & Body Art': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Beauty Tools': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Health Monitors': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Oral Hygiene': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Massage & Wellness': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Supplements': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'beauty:Medical': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── telecom ──
  'telecom:Phones': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'telecom:Headphones & Earphones': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'telecom:Bluetooth Headsets': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'telecom:Phone Cases & Bags': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'telecom:Phone Holders & Stands': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'telecom:Chargers & Cables': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'telecom:Screen Protectors': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'telecom:Memory Cards': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'telecom:Other Phone Accessories': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── electronics ──
  'electronics:Tablets': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'electronics:TVs': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'electronics:Cameras': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'electronics:Audio Equipment': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'electronics:Smart Home': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'electronics:Wearable Devices': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'electronics:Camera Accessories': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'electronics:Digital Cables': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'electronics:Selfie Sticks': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── hair ──
  'hair:Wigs': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'hair:Hair Extensions': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'hair:Lace Closures & Frontals': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'hair:Synthetic Hair': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'hair:Hair Care Tools & Accessories': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── computer ──
  'computer:Laptops': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'computer:Keyboards & Mice': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'computer:External Storage': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'computer:Networking': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'computer:Tablets & Accessories': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'computer:Office Electronics': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'computer:Other Computer': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── automobile ──
  'automobile:Car Electronics': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'automobile:Car Audio & GPS': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'automobile:Interior Accessories': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'automobile:Exterior Accessories': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'automobile:Motorcycle Parts & Gear': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'automobile:Tools & Maintenance': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'automobile:Diagnostic Tools': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'automobile:Car Care & Washing': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'automobile:Safety & Surveillance': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'automobile:Hand Tools': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── sports ──
  'sports:Fitness Equipment': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'sports:Yoga': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'sports:Camping & Hiking Gear': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'sports:Cycling': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'sports:Water Sports': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'sports:Ball Sports': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'sports:Fishing Gear': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'sports:Musical Instruments': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'sports:Sports Bags': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── furniture ──
  'furniture:Sofas & Couches': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Beds & Bed Frames': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Mattresses': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Dining Tables & Chairs': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Office Desks': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Office Chairs': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Wardrobes & Closets': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Bookshelves & Shelving': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:TV Stands': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Coffee & Side Tables': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Outdoor Furniture': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Cabinets & Storage': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Kids\' Furniture': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'furniture:Decor & Mirrors': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── vehicles ──
  'vehicles:Cars': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'vehicles:SUVs & Trucks': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'vehicles:Motorcycles': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'vehicles:Bicycles': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'vehicles:Auto Parts & Spares': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'vehicles:Tires & Rims': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'vehicles:Car Electronics': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'vehicles:Car Audio & GPS': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'vehicles:Helmets & Riding Gear': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'vehicles:Boats & Watercraft': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'vehicles:Heavy Machinery': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'vehicles:Vehicle Accessories': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── food ──
  'food:Fresh Produce': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'food:Meat & Poultry': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'food:Fish & Seafood': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'food:Dairy & Eggs': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'food:Packaged Snacks': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'food:Beverages': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'food:Bakery & Bread': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'food:Homemade Meals': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'food:Spices & Seasonings': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'food:Grains & Cereals': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'food:Cooking Oils': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'food:Catering Services': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── books ──
  'books:Textbooks': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'books:Novels & Fiction': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'books:Children\'s Books': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'books:Religious Books': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'books:Magazines': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'books:Notebooks & Pads': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'books:Pens & Writing Tools': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'books:Art Supplies': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'books:Craft Materials': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'books:School Supplies': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'books:Office Stationery': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'books:Calendars & Planners': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── agriculture ──
  'agriculture:Seeds & Seedlings': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'agriculture:Farm Tools': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'agriculture:Irrigation Equipment': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'agriculture:Fertilizers': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'agriculture:Pesticides': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'agriculture:Livestock': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'agriculture:Poultry': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'agriculture:Animal Feed': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'agriculture:Fresh Farm Produce': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'agriculture:Farm Machinery': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'agriculture:Greenhouse Supplies': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'agriculture:Beekeeping Supplies': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── services ──
  'services:Plumbing': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'services:Electrical Work': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'services:Cleaning Services': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'services:Tutoring & Lessons': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'services:Photography & Videography': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'services:Catering': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'services:Event Planning': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'services:Repairs & Maintenance': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'services:Hair & Beauty Services': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'services:Transport & Moving': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'services:Construction & Renovation': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'services:IT & Tech Support': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── property ──
  'property:For Rent — Houses': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'property:For Rent — Apartments': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'property:For Sale — Houses': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'property:For Sale — Apartments': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'property:Land for Sale': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'property:Land for Rent': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'property:Office Space': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'property:Commercial Space': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'property:Shared Rooms': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'property:Short-Term Stays': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'property:Warehouses': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── other ──
  'other:Miscellaneous': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'other:Collectibles': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'other:Pet Supplies': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'other:Gift Items': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'other:Lost & Found': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'other:Event Tickets': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'other:Other': `${SUBCAT_BASE}SUBCTEST.jpg`,

  // ── free ──
  'free:Still Works': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'free:Slightly Damaged': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'free:Heavily Damaged': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'free:Dead / Not Working': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'free:Spare Parts / Junk': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'free:Missing Parts': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'free:Expired (Food/Cosmetics)': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'free:Mystery Bundle': `${SUBCAT_BASE}SUBCTEST.jpg`,
  'free:Other': `${SUBCAT_BASE}SUBCTEST.jpg`,
};
