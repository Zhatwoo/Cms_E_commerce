export type IndustryOption = {
  key: string;
  label: string;
};

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { key: 'fashion-apparel', label: 'Fashion & Apparel' },
  { key: 'electronics-tech', label: 'Electronics & Tech' },
  { key: 'home-living', label: 'Home & Living' },
  { key: 'food-beverage', label: 'Food & Beverage' },
  { key: 'beauty', label: 'Beauty' },
  { key: 'kids-toys-hobbies', label: 'Kids, Toys & Hobbies' },
  { key: 'pets', label: 'Pets' },
  { key: 'automotive', label: 'Automotive' },
  { key: 'sports-fitness', label: 'Sports & Fitness' },
  { key: 'creative-handmade', label: 'Creative & Handmade' },
  { key: 'other', label: 'Other' },
];

const CATEGORY_PRESETS: Record<string, string[]> = {
  'fashion-apparel': [
    'T-shirt',
    'Pants',
    'Shoes',
    'Dress',
    'Jacket',
    'Bag',
    'Accessories',
  ],
  'electronics-tech': [
    'Laptop',
    'Desktop PC',
    'Computer Accessories',
    'Mobile Phone',
    'Gaming Console',
    'Camera',
    'Audio Device',
  ],
  'home-living': [
    'Furniture',
    'Kitchenware',
    'Home Decor',
    'Bedding',
    'Storage & Organization',
    'Lighting',
  ],
  'food-beverage': [
    'Snacks',
    'Beverages',
    'Frozen Food',
    'Bakery',
    'Coffee & Tea',
    'Condiments',
  ],
  beauty: [
    'Skincare',
    'Makeup',
    'Fragrance',
    'Hair Care',
    'Body Care',
    'Beauty Tools',
  ],
  'kids-toys-hobbies': [
    'Toys',
    'Educational Toys',
    'Baby Essentials',
    'Board Games',
    'Collectibles',
    'School Supplies',
  ],
  pets: [
    'Pet Food',
    'Pet Treats',
    'Pet Accessories',
    'Pet Grooming',
    'Pet Health',
  ],
  automotive: [
    'Car Accessories',
    'Motorcycle Accessories',
    'Car Care',
    'Tools & Equipment',
    'Replacement Parts',
  ],
  'sports-fitness': [
    'Sportswear',
    'Fitness Equipment',
    'Outdoor Gear',
    'Footwear',
    'Sports Accessories',
  ],
  'creative-handmade': [
    'Handmade Crafts',
    'Art Supplies',
    'Personalized Gifts',
    'DIY Kits',
    'Stationery',
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
  'fashion': 'fashion-apparel',
  'fashion-apparel': 'fashion-apparel',
  'electronics': 'electronics-tech',
  'electronics-tech': 'electronics-tech',
  'home-living': 'home-living',
  'food-beverage': 'food-beverage',
  'kids-toys-and-hobbies': 'kids-toys-hobbies',
  'sports-and-fitness': 'sports-fitness',
  'creative-and-handmade': 'creative-handmade',
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
