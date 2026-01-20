const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Candidate = require('../models/candidate');
const { jwtAuthMiddleware } = require('../jwt');

//   HELPER FUNCTION  
const checkAdminRole = async (userID) => {
  try {
    const user = await User.findById(userID);
    return user && user.role === 'admin';
  } catch (err) {
    return false;
  }
};

//   PUBLIC ROUTES  
// Get vote count (PUBLIC)
router.get('/vote/count', async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ voteCount: -1 });

    const voteRecord = candidates.map(candidate => ({
      party: candidate.party,
      count: candidate.voteCount
    }));

    res.status(200).json(voteRecord);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all candidates (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const candidates = await Candidate.find({}, 'name party');
    res.status(200).json(candidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//   ADMIN ROUTES  

// Add candidate (ADMIN ONLY)
router.post('/', jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const newCandidate = new Candidate(req.body);
    const savedCandidate = await newCandidate.save();

    res.status(200).json(savedCandidate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update candidate (ADMIN ONLY)
router.put('/:candidateID', jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.candidateID,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.status(200).json(updatedCandidate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete candidate (ADMIN ONLY)
router.delete('/:candidateID', jwtAuthMiddleware, async (req, res) => {
  try {
    if (!(await checkAdminRole(req.user.id))) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const deletedCandidate = await Candidate.findByIdAndDelete(req.params.candidateID);

    if (!deletedCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.status(200).json(deletedCandidate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//   USER ROUTES  

// Vote for candidate (USER ONLY)
router.get('/vote/:candidateID', jwtAuthMiddleware, async (req, res) => {
  try {
    const candidateID = req.params.candidateID;
    const userId = req.user.id;

    const candidate = await Candidate.findById(candidateID);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admin cannot vote' });
    }

    if (user.isVoted) {
      return res.status(400).json({ message: 'You have already voted' });
    }

    candidate.votes.push({ user: userId });
    candidate.voteCount += 1;
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
