const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    const Admin = require('./models/Admin.js');
    console.log("Updating role logic...");
    let admin = await Admin.findOne({ email: 'narayanphukan30@gmail.com' });
    if(admin) {
         admin.role = 'developer';
         admin.isApproved = true;
         // bypass validation on phone if not set correctly (the model requires /^[0-9]{10}$/)
         if(!admin.phone || !/^[0-9]{10}$/.test(admin.phone)) {
             admin.phone = '9876543210';
         }
         await admin.save();
         console.log("Admin updated successfully", admin);
    }
    process.exit(0);
}).catch(console.error);

