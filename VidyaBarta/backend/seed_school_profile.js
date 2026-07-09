/**
 * One-time migration: Seeds the schoolProfile data into the database.
 * Run once after deploying the schema changes so the existing site doesn't
 * show blank values. After this, all data is managed via the Admin Panel.
 *
 * Usage: node seed_school_profile.js
 */
const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config({ path: __dirname + '/.env' });
const SiteContent = require('./models/SiteContent');

async function seed() {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for School Profile seeding...");

    const doc = await SiteContent.findOne().lean();

    // Only seed if schoolProfile.name is empty/missing (hasn't been set yet)
    if (doc?.schoolProfile?.name) {
      console.log("School Profile already has a name:", doc.schoolProfile.name);
      console.log("Skipping seed — data already exists.");
      await mongoose.disconnect();
      process.exit(0);
    }

    const schoolProfileData = {
      name: "Holy Name School",
      logo: "/Pictures/Logo.jpg",
      punchLine: "Let Your Light Shine",
      phone: "6901055733",
      email: "holynameschool@gmail.com",
      officeHours: "9am - 1:30pm (Mon - Sat)",
      officeAddress: "XMH8+GGW, Nazira Ali Rd, Hatimuria, Assam 785697",
      mapLink: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3555.6218095340837!2d94.66374457624775!3d26.978873257242732!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x374736eaad53cc3d%3A0x49d6b196c9334e5d!2sHoly%20Name%20School!5e0!3m2!1sen!2sin!4v1774612478828!5m2!1sen!2sin",
      heroImages: [
        "/Pictures/1.JPG",
        "/Pictures/2.JPG",
        "/Pictures/3.JPG",
        "/Pictures/4.JPG",
        "/Pictures/5.JPG",
        "/Pictures/6.JPG",
      ]
    };

    const result = await SiteContent.updateOne(
      {},
      { $set: { schoolProfile: schoolProfileData } },
      { upsert: true }
    );

    console.log("Seed result:", result);

    // Verify
    const verify = await SiteContent.findOne().lean();
    console.log("Verified School Name:", verify?.schoolProfile?.name);
    console.log("Verified Phone:", verify?.schoolProfile?.phone);
    console.log("Verified Hero Images:", verify?.schoolProfile?.heroImages?.length, "images");

    await mongoose.disconnect();
    console.log("\n✅ School Profile seeded successfully! All future changes should be made via the Admin Panel.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
