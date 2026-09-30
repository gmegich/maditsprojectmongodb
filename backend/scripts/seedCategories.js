const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Category = require('../models/Category');

dotenv.config();

const DEFAULT_CATEGORIES = [
  {
    name: 'Traditional Foods',
    description: 'Foods and ingredients from South Sudanese cuisine',
  },
  {
    name: 'Traditional Clothing',
    description: 'Cultural attire and fashion',
  },
  {
    name: 'Cosmetics',
    description: 'Beauty and personal care products',
  },
  {
    name: 'Cultural Products',
    description: 'Heritage and cultural items',
  },
  {
    name: 'Handmade Products',
    description: 'Crafts and handmade goods',
  },
  {
    name: 'Other South Sudanese Products',
    description: 'Other products from South Sudanese suppliers',
  },
];

const seedCategories = async () => {
  try {
    await connectDB();

    let created = 0;
    let skipped = 0;

    for (const category of DEFAULT_CATEGORIES) {
      const existing = await Category.findOne({ name: category.name });
      if (existing) {
        skipped += 1;
        continue;
      }

      await Category.create({
        ...category,
        status: 'active',
      });
      created += 1;
    }

    console.log(`Category seed complete. Created: ${created}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error(`Category seed failed: ${error.message}`);
    process.exit(1);
  }
};

seedCategories();
