const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const Admin = require('./models/Admin'); // Only Admin now
const Order = require('./models/Order'); //import Order schema
const User = require('./models/User'); // import User LogIn/SignUp schema
const Feedback = require('./models/feedbackModel'); //import feedback Schema
const Cart = require('./models/cartSchema'); // make cart collection

const sendMail = require('./mailer'); // because we want to send mail


const app = express();
const PORT = 3000;

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/zonic', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Or your frontend's real origin
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'zonicSessionSecret', // session will be used for both the user and admin.
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // only true in HTTPS
}));


// ========== AUTH Middleware ==========
function isAuthenticated(req, res, next) {
  if (req.session && req.session.admin) {
    next();
  } else {
    res.redirect('/adminLogin.html');
  }
}

// ========== Admin Login ==========
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.json({ success: false, message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.json({ success: false, message: 'Invalid credentials' });

    // Store admin session as object
    req.session.admin = { username: admin.username };

    res.json({ success: true });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
//Admin LogOut
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/adminLogin.html');
  // res.redirect('/index.html')
});

// Protect dashboard route
app.get('/admin.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ========== Product Handling ==========
function getCategoryModel(category) {
  const schema = new mongoose.Schema({
    title: String,
    price: Number,
    stock: Number,
    image: String,
    category: String
  }, { collection: category.toLowerCase() });

  return mongoose.models[category] || mongoose.model(category, schema);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.post('/products', upload.single('image'), async (req, res) => {
  const title = req.body.title;
  const price = parseFloat(req.body.price);
  const stock = parseInt(req.body.stock);
  const category = req.body.category;

  if (!title || !price || stock == null || !category || !req.file) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const image = req.file.filename;

  const ProductModel = getCategoryModel(category);
  const product = new ProductModel({ title, price, stock, category, image });

  try {
    await product.save();
    res.status(200).json({ success: true });
  }
  catch (err) {
    console.error('Error saving product:', err);
    res.status(500).send({ success: false, message: 'Server error' });
  }
});

app.get('/products', async (req, res) => {
  const category = req.query.category;
  if (!category) return res.status(400).send('Category is required');
  try {
    const Model = getCategoryModel(category.trim());
    const products = await Model.find();
    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).send('Error fetching products');
  }
});

app.delete('/products/:id', async (req, res) => {
  const category = req.query.category;
  if (!category) return res.status(400).send('Category is required');

  const ProductModel = getCategoryModel(category);
  await ProductModel.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

app.put('/products/:id', upload.single('image'), async (req, res) => {
  const { title, price, stock, category } = req.body;
  if (!category) return res.status(400).send('Category is required');

  const updateData = { title, price, stock, category };
  if (req.file) updateData.image = req.file.filename;

  const ProductModel = getCategoryModel(category);
  const updatedProduct = await ProductModel.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!updatedProduct) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ success: true, product: updatedProduct });
});


// Signup Route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: 'Signup error' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email
    };
    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: 'Login error' });
  }
});

// Logout Route
// User logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});


// Check if Logged In
app.get('/me', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

// add feedback
app.post('/submit-feedback', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const newFeedback = new Feedback({ name, email, subject, message });
    await newFeedback.save();
    res.status(200).json({ message: 'Feedback saved successfully' });
  } catch (err) {
    console.error('Error saving feedback:', err);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

//get feedback for admin dashboard
app.get('/api/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

//get feedback for contact page with a limit of latest 3 reviews
app.get('/api/latest-feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(3);
    res.status(200).json(feedbacks);
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

//1. add to cart API
app.post('/api/cart/add', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'User not LoggedIn' });
    }

    const { productId, title, price, image, category } = req.body;

    const existing = await Cart.findOne({ userId: req.session.user._id, productId });
    if (existing) {
      existing.quantity += 1;
      await existing.save();

    } else {
      // Fetch original product to get correct ObjectId
      const ProductModel = getCategoryModel(category);
      const product = await ProductModel.findById(productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const newItem = new Cart({
        userId: req.session.user._id,
        productId,
        originalId: product._id,  // store original product ID for stock update
        title,
        price,
        image,
        category
      });

      await newItem.save();
    }

    res.status(200).json({ message: 'Product added to cart' });
  } catch (err) {
    console.error('Cart Add Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});






//get for cart
app.get('/api/cart/items', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "User not LoggedIn" })
    }
    const items = await Cart.find({ userId: req.session.user._id });
    res.json(items)
  }
  catch (err) {
    console.error('Cart fetch error: ', err);
    res.status(500).json({ message: 'Server error' });
  }
});
//delete for cart
app.delete('/api/cart/remove/:id', async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);
    res.sendStatus(200);
  }
  catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

//update cart item quantity
app.patch('/api/cart/update/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be >= 1' })
    }

    await Cart.findByIdAndUpdate(req.params.id, { quantity });
    res.sendStatus(200);
  }
  catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

//1. place-order API
app.post('/place-order', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not logged in' });
    }

    const { name, contact, address, email, items, paymentMethod } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items to order.' });
    }

    const itemIds = items.map(i => i.id);
    const cartItems = await Cart.find({ _id: { $in: itemIds }, userId: req.session.user._id });

    // Final items for order + update stocks
    const orderItems = [];

    for (const cartItem of cartItems) {
      const item = items.find(i => i.id === cartItem._id.toString());
      if (!item) continue;

      const quantity = item.quantity;
      const ProductModel = getCategoryModel(cartItem.category);

      //  Decrement stock
      const product = await ProductModel.findById(cartItem.originalId);
      if (!product) continue;

      if (product.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.title}` });
      }

      product.stock -= quantity;
      await product.save();

      orderItems.push({
        id: cartItem.productId,
        title: cartItem.title,
        price: cartItem.price,
        image: cartItem.image,
        quantity,
        category: cartItem.category
      });
    }

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newOrder = new Order({
      name,
      contact,
      address,
      email,
      items: orderItems,
      total,
      paymentMethod
    });

    await newOrder.save();

    //for sending email   
    await sendMail(email, 'Order Confirmation - Zonic Marketers', `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
    <h2 style="color: #a14455;">Hello ${name},</h2>
    <p style="font-size: 16px;">Thank you for shopping at <strong>Zonic Marketers</strong>! Your order has been placed successfully.</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

    <h3 style="color: #b0757e;">🧾 Order Summary</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #fdfbfa;">
          <th align="left" style="padding: 8px; border-bottom: 1px solid #ddd;">Product</th>
          <th align="center" style="padding: 8px; border-bottom: 1px solid #ddd;">Qty</th>
          <th align="right" style="padding: 8px; border-bottom: 1px solid #ddd;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${i.title}</td>
            <td align="center" style="padding: 8px; border-bottom: 1px solid #eee;">${i.quantity}</td>
            <td align="right" style="padding: 8px; border-bottom: 1px solid #eee;">Rs ${i.price}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <p style="font-size: 16px; margin-top: 20px;"><strong>Total: Rs ${total}</strong></p>
    <p style="font-size: 16px;">Payment Method: <strong>${paymentMethod}</strong></p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 20px;">

    <p style="font-size: 14px; color: #555;">We'll keep you updated as your order is processed and shipped. If you have any questions, feel free to contact our support.</p>

    <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">&copy; 2025 Zonic Marketers. All rights reserved.</p>
  </div>
`);




    // Remove from cart
    await Cart.deleteMany({
      _id: { $in: itemIds },
      userId: req.session.user._id
    });

    res.status(200).json({ message: 'Order placed successfully' });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});









//get all orders for Admin
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }); //To show newest orders first.
    res.json(orders);
  }
  catch (err) {
    console.error('Error fetching orders', err);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

//for sending email at status update

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    // 1. Find the order first
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 2. Update status
    order.status = status;
    await order.save();

    // 3. Send email if order has email
    if (order.email) {
      const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
    <h2 style="color: #a14455;">Zonic Marketers - Order Update</h2>

    <p style="font-size: 16px;">Dear ${order.name},</p>

    <p style="font-size: 16px;">
      We wanted to let you know that the status of your order 
      <strong>#${order._id}</strong> has been updated to 
      <span style="color: #a14455; font-weight: bold;">${order.status.toUpperCase()}</span>.
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

    <h3 style="color: #b0757e;">🧾 Order Summary</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #fdfbfa;">
          <th align="left" style="padding: 8px; border-bottom: 1px solid #ddd;">Product</th>
          <th align="center" style="padding: 8px; border-bottom: 1px solid #ddd;">Qty</th>
          <th align="right" style="padding: 8px; border-bottom: 1px solid #ddd;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(i => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${i.title}</td>
            <td align="center" style="padding: 8px; border-bottom: 1px solid #eee;">${i.quantity}</td>
            <td align="right" style="padding: 8px; border-bottom: 1px solid #eee;">Rs ${i.price}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <p style="font-size: 16px; margin-top: 20px;"><strong>Total: Rs ${order.total}</strong></p>
    <p style="font-size: 16px;">Payment Method: <strong>${order.paymentMethod}</strong></p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 20px;">

    <p style="font-size: 14px; color: #555;">
      If you have any questions or need help, feel free to reply to this email. We're here to help!
    </p>

    <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
      &copy; 2025 Zonic Marketers. All rights reserved.
    </p>
  </div>
`;


      await sendMail(order.email, 'Your Order Status has been Updated', html);
    } else {
      console.warn(`No email associated with order ${order._id}`);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});




//server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
