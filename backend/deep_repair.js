const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config({ path: 'd:/Holy Name/backend/.env' });
const SiteContent = require('./models/SiteContent');

async function repair() {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Deep Repair...");

    const principalData = {
      name: "Fr. Hemanta Pegu",
      title: "PRINCIPAL",
      introQuote: "Flowers leave part of their fragrance in the hand that bestows them",
      message: "Holy Name HS School, Cherekapar Sivasagar, has always aimed at the all-round development of its students. Our goal is to nurture intellectual, physical, spiritual, and emotional growth, preparing students to be responsible global citizens.",
      closingQuote: "Aristotle once said, \"Educating the mind without educating the heart is no education at all.\"",
      photo: "",
      signature: "/Pictures/assets/principal_signature.png",
    };

    const headMistressData = {
      photo: "/Pictures/assets/head_mistress_photo.png",
      greeting: "A warm welcome to Holy Name School",
      message: "On behalf of the Management and staff, I extend a loving welcome to you to the new academic year. Holy Name HS School has always aimed at the all-round development of its students.",
      signature: "/Pictures/assets/head_mistress_signature.png"
    };

    // Use updateMany to ensure NO document is left with the offensive content
    const result = await SiteContent.updateMany(
      {}, 
      { 
        $set: { 
          principal: principalData,
          headMistress: headMistressData 
        } 
      }
    );

    console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`);
    
    // Final check on the authoritative data
    const finalCheck = await SiteContent.findOne().lean();
    console.log("Current Principal Name in DB:", finalCheck?.principal?.name);
    console.log("Current Principal Signature in DB:", finalCheck?.principal?.signature);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Deep repair failed:", error);
    process.exit(1);
  }
}

repair();
