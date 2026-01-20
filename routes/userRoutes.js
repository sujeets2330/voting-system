const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { jwtAuthMiddleware, generateToken } = require('../jwt');

//   USER SIGNUP  
router.post('/signup', async (req, res) => {
  try {
    const { name, age, address, aadharCardNumber, password } = req.body;

    if (!name || !age || !address || !aadharCardNumber || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!/^\d{12}$/.test(aadharCardNumber)) {
      return res.status(400).json({ error: 'Aadhar must be exactly 12 digits' });
    }

    const exists = await User.findOne({ aadharCardNumber });
    if (exists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({
      name,
      age,
      address,
      aadharCardNumber,
      password,
      role: 'voter',     
      isVoted: false
    });

    await user.save();
    res.status(201).json({ message: "Signup successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


//   USER LOGIN  
router.post('/login', async (req, res) => {
  try {
    const { aadharCardNumber, password } = req.body;

    if (!aadharCardNumber || !password) {
      return res.status(400).json({ error: 'Aadhar Card Number and password are required' });
    }

    const user = await User.findOne({ aadharCardNumber });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid Aadhar Card Number or Password' });
    }

    const token = generateToken({ id: user.id });

    res.json({
      token,
      role: user.role
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//   USER PROFILE  
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//   CHANGE PASSWORD  
router.put('/profile/password', jwtAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//   ADMIN STATS  
router.get('/admin/stats', jwtAuthMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const totalUsers = await User.countDocuments({ role: 'voter' });
    const votedUsers = await User.countDocuments({ role: 'voter', isVoted: true });

    res.json({
      totalUsers,
      votedUsers
    });
  } catch (err) {
    console.error('ADMIN STATS ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
