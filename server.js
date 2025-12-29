require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const https = require('https');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
// const csurf = require('csurf'); // CSRF protection - enabled later

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Trust Proxy (Required for Render/Heroku/Cloud behind Load Balancer)
app.enable('trust proxy');

// Session Management
// NOTE: In production, use a persistent store like Redis or Mongo
app.use(session({
    secret: process.env.SESSION_SECRET || 'super_secret_spid_cie_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Requires HTTPS
        maxAge: 3600000 // 1 hour
    }
}));

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static files (for assets)
app.use(express.static(path.join(__dirname, 'public')));

// CSRF Protection (Optional for demo start, recommended for prod)
// app.use(csurf());

// Routes
const authRoutes = require('./routes/auth');

app.use('/', authRoutes);

// Home Route
app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

// HTTPS Server
const httpsOptions = {
    key: fs.readFileSync('./certs/server.key'),
    cert: fs.readFileSync('./certs/server.crt')
};

https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`SPID/CIE Demo Server running on https://localhost:${PORT}`);
});
