const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config({ path: 'd:/Holy Name/backend/.env' });
const SiteContent = require('./models/SiteContent');

const MONGO_URI = process.env.MONGO_URI;

const repair = async () => {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for emergency repair...");

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

    const result = await SiteContent.findOneAndUpdate(
      {},
      { 
        $set: { 
          principal: principalData,
          headMistress: headMistressData
        } 
      },
      { new: true, upsert: true }
    );

    if (result) {
      console.log("Emergency repair successful. Malicious content purged.");
      console.log("Restored Principal:", result.principal.name);
      console.log("Restored Head Mistress Message:", result.headMistress.greeting);
    } else {
      console.warn("No site content document found to repair.");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Repair failed:", error.message);
    process.exit(1);
  }
};

repair();
