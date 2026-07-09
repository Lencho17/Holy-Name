const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
}).then(async () => {
    const Admin = require('./models/Admin.js');
    const admins = await Admin.find({});
    console.log(JSON.stringify(admins, null, 2));
    process.exit(0);
}).catch(console.error);

