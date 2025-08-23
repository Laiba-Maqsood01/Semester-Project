// models/Product.js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required : true,
    ref : 'User'
  },
  productId: {
    type: String,
    required : true
  },
  originalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }, 
  title: String,
  price : Number,
  image : String,
  quantity : {
    type: Number,
    default : 1
  },
  category:{
    type: String,
    required : true
  }
});

module.exports = mongoose.model("Cart", cartSchema);