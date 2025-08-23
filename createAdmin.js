const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');

mongoose.connect('mongodb://127.0.0.1:27017/zonic')
  .then(async () => {
    const existing = await Admin.findOne({ username: 'admin' });
    if (existing) {
      console.log('Admin already exists');
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({ username: 'admin', password: hashedPassword });
      console.log('Admin created');
    }
    mongoose.disconnect();
  });
