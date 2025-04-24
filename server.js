const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('winston');

// Load environment variables
dotenv.config();

// Configure logger
const log = logger.createLogger({
  level: 'info',
  format: logger.format.combine(logger.format.timestamp(), logger.format.json()),
  transports: [new logger.transports.Console(), new logger.transports.File({ filename: 'server.log' })],
});

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => log.info('MongoDB connected'))
  .catch((err) => log.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true in production with HTTPS
  })
);
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport'); // Configure Passport

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (e.g., Bootstrap)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/auth'));
app.use('/auth', require('./routes/google'));

// Error handling middleware
app.use((err, req, res, next) => {
  log.error(err.stack);
  res.status(500).send('Internal Server Error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => log.info(`Server running on port ${PORT}`));