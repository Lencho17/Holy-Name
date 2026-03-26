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
      label: String,
      value: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('SiteContent', siteContentSchema);
