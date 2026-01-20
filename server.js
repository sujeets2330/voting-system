const express = require('express');
const app = express();
const db = require('./db');
require('dotenv').config();

const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');


// MIDDLEWARE
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// VIEW ENGINE (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend/views'));


// STATIC FILES
app.use(express.static(path.join(__dirname, 'frontend')));


// API ROUTES
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);


// FRONTEND PAGE ROUTES


// Main landing page
app.get('/', (req, res) => {
  res.render('index');
});

// User auth
app.get('/user-login', (req, res) => {
  res.render('user-login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

// User dashboard (vote)
app.get('/user-dashboard', (req, res) => {
  res.render('user-dashboard');
});

// Admin auth & dashboard
app.get('/admin-login', (req, res) => {
  res.render('admin-login');
});

app.get('/admin-dashboard', (req, res) => {
  res.render('admin-dashboard');
});


// SERVER START

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
