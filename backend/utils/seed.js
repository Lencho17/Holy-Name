const Admin = require('../models/Admin');
const SiteContent = require('../models/SiteContent');

/**
 * Seeds the database with default Super Admin and Site Content if missing.
 * This is designed to be called asynchronously and not block the main request handling.
 */
const seedData = async () => {
  try {
    const defaultEmail = 'narayanphukan30@gmail.com';
    
    // 1. Seed default superadmin
    const defaultAdmin = await Admin.findOne({ email: defaultEmail });
    
    if (!defaultAdmin) {
      await Admin.create({
        email: defaultEmail,
        password: 'admin123',
        name: 'Super Admin',
        role: 'superadmin'
      });
      console.log(`🔐 Default Super Admin created: ${defaultEmail}`);
    } else if (defaultAdmin.role !== 'superadmin') {
      await Admin.updateOne(
        { email: defaultEmail },
        { $set: { role: 'superadmin' } }
      );
      console.log(`🔐 Elevated ${defaultEmail} to Super Admin`);
    }

    // 2. Seed default site content
    const contentCount = await SiteContent.countDocuments();
    if (contentCount === 0) {
      const defaultSiteContent = {
        gallery: [],
        events: [],
        highlights: [],
        videos: [],
        faculty: { Guest: [], Science: [], Arts: [] },
        principal: {
          name: "Fr. Hemanta Pegu",
          title: "Principal",
          introQuote: "Flowers leave part of their fragrance in the hand that bestows them",
          message: "Holy Name HS School, Cherekapar Sivasagar...",
          closingQuote: "Aristotle once said, \"Educating the mind without educating the heart is no education at all.\"",
        },
      };
      await SiteContent.create(defaultSiteContent);
      console.log('📦 Default site content seeded');
    }
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
  }
};

module.exports = seedData;
