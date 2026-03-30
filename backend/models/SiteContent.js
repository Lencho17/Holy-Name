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
      galleryImages: [String],
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
    name: { type: String, default: "" },
    logo: { type: String, default: "" },
    punchLine: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    affiliation: { type: [String], default: [] },
    officeHours: { type: String, default: "" },
    officeAddress: { type: String, default: "" },
    mapLink: { type: String, default: "" },
    onlineAdmissionInstructions: {
      type: [String],
      default: ["Fill up the form", "Upload all documents marked compulsory", "Pay the Fee", "Download & Print Acknowledgement Receipt", "Submit the receipt during interview date allotted", "You can check the status of your application by reference number or email verification"]
    },
    offlineAdmissionInstructions: {
      type: [String],
      default: ["Visit the school administrative block during working hours (9 AM - 3 PM).", "Collect the admission application packet from the front desk.", "Fill out the form manually in CAPITAL letters.", "Attach photocopies of necessary documents.", "Submit the completed docket and pay the fee at the cash counter."]
    },
    heroImages: {
      type: [String],
      default: []
    },
    pageHeroImages: {
      about: { type: String, default: "" },
      admission: { type: String, default: "" },
      career: { type: String, default: "" },
      complaints: { type: String, default: "" },
      contact: { type: String, default: "" },
      courses: { type: String, default: "" },
      faculty: { type: String, default: "" },
      gallery: { type: String, default: "" },
      notice: { type: String, default: "" },
      principal: { type: String, default: "" },
      studentPortal: { type: String, default: "" }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('SiteContent', siteContentSchema);
