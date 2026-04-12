const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Admin = require('./models/Admin.js');
    console.log("Deleting pending admin...");
    const result = await Admin.deleteOne({ email: 'narayanwork30@gmail.com' });
    console.log(`Deleted ${result.deletedCount} admin(s).`);
    process.exit(0);
}).catch(console.error);
