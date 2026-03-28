const mongoose = require('mongoose');

// Single-document store for all dynamic site content
const siteContentSchema = new mongoose.Schema({
  gallery: [
    {
      id: Number,
      category: String,
      title: String,
      src: String,
      featured: { type: Boolean, default: false },
      description: String,
      eventId: { type: Number, default: null },
    },
  ],
  events: [
    {
      id: Number,
      title: String,
      date: String,
      image: String,
      description: String,
      galleryImages: [String],
    },
  ],
  highlights: [
    {
      id: Number,
      title: String,
      date: String,
      category: String,
      image: String,
      description: String,
    },
  ],
  videos: [
    {
      id: Number,
      src: String,
      title: String,
    },
  ],
  notices: [
    {
      id: Number,
      title: String,
      date: String,
      size: String,
      pdfLink: String,
    },
  ],
  alumni: [
    {
      id: Number,
      name: String,
      passedYear: String,
      rank: String,
      percentage: String,
      level: String, // 'HSLC' or 'HS'
      stream: String, // 'Arts', 'Science', 'Commerce'
      subjects: [String],
      photo: String,
    }
  ],
  faculty: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  principal: {
    name: String,
    title: String,
    introQuote: String,
    message: String,
    closingQuote: String,
    photo: String,
    signature: { type: String, default: "https://via.placeholder.com/150x50" },
  },
  notificationEmail: {
    type: String,
    default: "office@lenchosolutions.com"
  },
  banner: {
    isActive: { type: Boolean, default: false },
    image: { type: String, default: null },
    link: { type: String, default: null }
  },
  socialLinks: {
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    youtube: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    whatsappChannel: { type: String, default: "" }
  },
  stats: [
    {
      id: String,
      label: String,
      value: String
    }
  ],
  visionStatement: {
    type: String,
    default: "Holy Name High School, Sivasagar, envisions to be a center of excellence that imparts holistic education to its students. We strive to nurture the intellectual, physical, spiritual, and emotional growth of each child, preparing them to be responsible global citizens."
  },
  aimsAndObjectives: [
    {
      title: String,
      description: String
    }
  ],
  headMistress: {
    photo: { type: String, default: "" },
    greeting: { type: String, default: "A warm welcome to Holy Name School" },
    message: { type: String, default: "On behalf of the Management and staff, I extend a loving welcome to you to the new academic year. Holy Name School has always aimed at the all-round development of its students..." },
    signature: { type: String, default: "https://via.placeholder.com/150x50" }
  },
  schoolProfile: {
    logo: { type: String, default: "/Pictures/Logo.jpg" },
    punchLine: { type: String, default: "Let Your Light Shine" },
    phone: { type: String, default: "6901055733" },
    email: { type: String, default: "holynameschool@gmail.com" },
    officeHours: { type: String, default: "9am - 1:30pm (Mon - Sat)" },
    officeAddress: { type: String, default: "XMH8+GGW, Nazira Ali Rd, Hatimuria, Assam 785697" },
    mapLink: { type: String, default: "" },
    heroImages: {
      type: [String],
      default: [
        "/Pictures/1.JPG",
        "/Pictures/2.JPG",
        "/Pictures/3.JPG",
        "/Pictures/4.JPG",
        "/Pictures/5.JPG",
        "/Pictures/6.JPG",
      ]
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('SiteContent', siteContentSchema);
