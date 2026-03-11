export type IndustryOption = {
  key: string;
  label: string;
};

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { key: 'clothing-apparel', label: 'Clothing & Apparel' },
  { key: 'shoes-footwear', label: 'Shoes & Footwear' },
  { key: 'bags-luggage', label: 'Bags & Luggage' },
  { key: 'jewelry-accessories', label: 'Jewelry & Accessories' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'computer-accessories', label: 'Computer & Accessories' },
  { key: 'home-living', label: 'Home & Living' },
  { key: 'appliances', label: 'Appliances' },
  { key: 'beauty-personal-care', label: 'Beauty & Personal Care' },
  { key: 'health-wellness', label: 'Health & Wellness' },
  { key: 'automotive', label: 'Automotive' },
  { key: 'sports-outdoors', label: 'Sports & Outdoors' },
  { key: 'toys-games', label: 'Toys & Games' },
  { key: 'pet-supplies', label: 'Pet Supplies' },
  { key: 'office-school-supplies', label: 'Office & School Supplies' },
  { key: 'books-media', label: 'Books & Media' },
  { key: 'digital-products', label: 'Digital Products' },
  { key: 'tools-home-improvement', label: 'Tools & Home Improvement' },
];

const CATEGORY_PRESETS: Record<string, string[]> = {
  'clothing-apparel': [
    "Men's Apparel - Polo Shirts",
    "Men's Apparel - T-Shirts",
    "Men's Apparel - Long Sleeves",
    "Men's Apparel - Jackets",
    "Men's Apparel - Hoodies",
    "Men's Apparel - Pants",
    "Men's Apparel - Shorts",
    "Men's Apparel - Underwear",
    "Women's Apparel - Dresses",
    "Women's Apparel - Blouses",
    "Women's Apparel - T-Shirts",
    "Women's Apparel - Skirts",
    "Women's Apparel - Jackets",
    "Women's Apparel - Pants",
    "Women's Apparel - Lingerie",
    'Unisex Apparel - Hoodies',
    'Unisex Apparel - Sweatshirts',
    'Unisex Apparel - Joggers',
    'Kids & Baby Clothing - Baby Clothing',
    'Kids & Baby Clothing - Boys Clothing',
    'Kids & Baby Clothing - Girls Clothing',
  ],
  'shoes-footwear': [
    "Men's Shoes - Sneakers",
    "Men's Shoes - Formal Shoes",
    "Men's Shoes - Sandals",
    "Men's Shoes - Boots",
    "Women's Shoes - Heels",
    "Women's Shoes - Flats",
    "Women's Shoes - Sneakers",
    "Women's Shoes - Sandals",
    'Kids Shoes - School Shoes',
    'Kids Shoes - Sandals',
    'Kids Shoes - Sneakers',
  ],
  'bags-luggage': [
    'Backpacks',
    'Handbags',
    'Wallets',
    'Travel Bags',
    'Suitcases',
    'Laptop Bags',
  ],
  'jewelry-accessories': [
    'Necklaces',
    'Rings',
    'Bracelets',
    'Earrings',
    'Watches',
    'Sunglasses',
    'Hats & Caps',
    'Belts',
  ],
  electronics: [
    'Mobile Phone',
    'Laptops',
    'Tablets',
    'Cameras',
    'Audio Devices - Headphones',
    'Audio Devices - Earbuds',
    'Audio Devices - Speakers',
    'Wearable Technology - Smartwatches',
    'Wearable Technology - Fitness Trackers',
  ],
  'computer-accessories': [
    'Keyboards',
    'Mouse',
    'Monitors',
    'Storage Devices',
    'Computer Components - RAM',
    'Computer Components - SSD',
    'Computer Components - GPU',
    'Laptop Accessories',
  ],
  'home-living': [
    'Furniture - Beds',
    'Furniture - Sofas',
    'Furniture - Tables',
    'Furniture - Cabinets',
    'Home Decor - Wall Art',
    'Home Decor - Clocks',
    'Home Decor - Curtains',
    'Lighting - Ceiling Lights',
    'Lighting - Desk Lamps',
    'Kitchenware - Cookware',
    'Kitchenware - Utensils',
    'Kitchenware - Storage Containers',
  ],
  appliances: [
    'Kitchen Appliances - Microwaves',
    'Kitchen Appliances - Air Fryers',
    'Kitchen Appliances - Blenders',
    'Cleaning Appliances - Vacuum Cleaners',
    'Cooling & Heating - Air Conditioners',
    'Cooling & Heating - Electric Fans',
  ],
  'beauty-personal-care': [
    'Skincare',
    'Makeup',
    'Hair Care',
    'Fragrances',
    'Grooming',
    'Personal Hygiene',
  ],
  'health-wellness': [
    'Vitamins & Supplements',
    'Medical Supplies',
    'Fitness Equipment',
    'Health Monitoring Devices',
  ],
  'sports-outdoors': [
    'Fitness Equipment',
    'Camping Gear',
    'Cycling',
    'Outdoor Clothing',
    'Sports Accessories',
  ],
  automotive: [
    'Car Accessories',
    'Car Electronics',
    'Car Care',
    'Tools & Equipment',
    'Motorcycle Parts',
  ],
  'toys-games': [
    'Educational Toys',
    'Action Figures',
    'Board Games',
    'Puzzles',
    'Outdoor Toys',
  ],
  'pet-supplies': [
    'Pet Toys',
    'Pet Grooming',
    'Pet Beds',
    'Pet Accessories',
  ],
  'office-school-supplies': [
    'Notebooks',
    'Pens & Markers',
    'Office Equipment',
    'Printers',
    'Art Supplies',
  ],
  'books-media': [
    'Books',
    'eBooks',
    'Magazines',
    'Audiobooks',
  ],
  'digital-products': [
    'Software',
    'Online Courses',
    'Digital Art',
    'Templates',
  ],
  'tools-home-improvement': [
    'Power Tools',
    'Hand Tools',
    'Hardware',
    'Electrical Supplies',
    'Plumbing Supplies',
  ],
  other: [
    'General',
  ],
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const INDUSTRY_ALIAS: Record<string, string> = {
  // New canonical keys
  'clothing-and-apparel': 'clothing-apparel',
  'clothing-apparel': 'clothing-apparel',
  'shoes-and-footwear': 'shoes-footwear',
  'shoes-footwear': 'shoes-footwear',
  'bags-and-luggage': 'bags-luggage',
  'bags-luggage': 'bags-luggage',
  'jewelry-and-accessories': 'jewelry-accessories',
  'jewelry-accessories': 'jewelry-accessories',
  electronics: 'electronics',
  'computer-and-accessories': 'computer-accessories',
  'computer-accessories': 'computer-accessories',
  'home-and-living': 'home-living',
  'home-living': 'home-living',
  appliances: 'appliances',
  'beauty-and-personal-care': 'beauty-personal-care',
  'beauty-personal-care': 'beauty-personal-care',
  'health-and-wellness': 'health-wellness',
  'health-wellness': 'health-wellness',
  automotive: 'automotive',
  'sports-and-outdoors': 'sports-outdoors',
  'sports-outdoors': 'sports-outdoors',
  'toys-and-games': 'toys-games',
  'toys-games': 'toys-games',
  'pet-supplies': 'pet-supplies',
  'office-and-school-supplies': 'office-school-supplies',
  'office-school-supplies': 'office-school-supplies',
  'books-and-media': 'books-media',
  'books-media': 'books-media',
  'digital-products': 'digital-products',
  'tools-and-home-improvement': 'tools-home-improvement',
  'tools-home-improvement': 'tools-home-improvement',

  // Backward compatibility with existing saved projects
  fashion: 'clothing-apparel',
  'fashion-apparel': 'clothing-apparel',
  'electronics-tech': 'electronics',
  'food-beverage': 'home-living',
  beauty: 'beauty-personal-care',
  pets: 'pet-supplies',
  'sports-fitness': 'sports-outdoors',
  'creative-handmade': 'digital-products',
  'kids-toys-and-hobbies': 'toys-games',
  'kids-toys-hobbies': 'toys-games',
  other: 'other',
};

export function normalizeIndustryKey(rawIndustry?: string | null): string {
  const normalized = normalizeText(String(rawIndustry || ''));
  if (!normalized) return '';
  return INDUSTRY_ALIAS[normalized] || normalized;
}

export function getIndustryCategories(rawIndustry?: string | null): string[] {
  const key = normalizeIndustryKey(rawIndustry);
  return CATEGORY_PRESETS[key] || [];
}
