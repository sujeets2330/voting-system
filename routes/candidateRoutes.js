const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Candidate = require('../models/candidate');
const { jwtAuthMiddleware } = require('../jwt');

// HELPER  
const isAdmin = async (userId) => {
  const user = await User.findById(userId);
  return user && user.role === 'admin';
};

// PUBLIC ROUTES  

// Get all candidates (for user & admin dashboards)
router.get('/', async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.status(200).json(candidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get live vote count (PUBLIC)
router.get('/vote/count', async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ voteCount: -1 });

    const results = candidates.map(c => ({
      party: c.party,
      count: c.voteCount
    }));

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ADMIN ROUTES  

// Add candidate (ADMIN ONLY)
router.post('/', jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await isAdmin(req.user.id))) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const candidate = new Candidate({
      name: req.body.name,
      party: req.body.party,
      age: req.body.age
    });

    const saved = await candidate.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update candidate (ADMIN ONLY)
router.put('/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await isAdmin(req.user.id))) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const updated = await Candidate.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        party: req.body.party,
        age: req.body.age
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete candidate (ADMIN ONLY)
router.delete('/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await isAdmin(req.user.id))) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const deleted = await Candidate.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.status(200).json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// USER ROUTES 

// Vote for candidate (USER ONLY)
router.get('/vote/:id', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admin cannot vote' });
    }

    if (user.isVoted) {
      return res.status(400).json({ message: 'You have already voted' });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    candidate.voteCount += 1;
    candidate.votes.push({ user: user._id });
    await candidate.save();

    user.isVoted = true;
    await user.save();

    res.status(200).json({ message: 'Vote recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
