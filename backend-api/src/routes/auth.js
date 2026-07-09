import axios from 'axios';
import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';

dotenv.config();

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '274718427617-oorpin2skkpqvofmmgdljq7257kk46l0.apps.googleusercontent.com';

// Verify Google token and return user info
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      console.error('No ID token provided');
      return res.status(400).json({ error: 'ID token is required' });
    }

    console.log('Received Google token, attempting to verify...');

    // Use the access token to get user info from Google's userinfo endpoint
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    console.log('Google API response received:', response.status);

    const googleUserInfo = {
      googleId: response.data.sub,
      email: response.data.email,
      name: response.data.name,
      picture: response.data.picture,
      emailVerified: response.data.email_verified,
    };

    console.log('User info from Google:', googleUserInfo.email);

    // Check if user exists in database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [googleUserInfo.googleId, googleUserInfo.email]
    );

    let user;

    if (userResult.rows.length === 0) {
      // Create new user
      console.log('Creating new user for:', googleUserInfo.email);
      const insertResult = await pool.query(
        'INSERT INTO users (email, name, google_id) VALUES ($1, $2, $3) RETURNING *',
        [googleUserInfo.email, googleUserInfo.name, googleUserInfo.googleId]
      );
      user = insertResult.rows[0];
    } else {
      // Update existing user with Google ID if missing
      user = userResult.rows[0];
      if (!user.google_id) {
        console.log('Updating existing user with Google ID:', googleUserInfo.email);
        const updateResult = await pool.query(
          'UPDATE users SET google_id = $1, name = $2 WHERE id = $3 RETURNING *',
          [googleUserInfo.googleId, googleUserInfo.name, user.id]
        );
        user = updateResult.rows[0];
      }
    }

    console.log('Authentication successful for:', user.email);

    // Return user info
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.google_id,
        picture: googleUserInfo.picture,
      },
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('Google auth error:', error);
    console.error('Error details:', JSON.stringify(error.response?.data || error.message, null, 2));
    res.status(401).json({ 
      error: 'Invalid ID token',
      message: error.message 
    });
  }
});

// Signup with email and password
router.post('/signup', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING *',
      [email.toLowerCase(), name, hashedPassword]
    );

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: 'Failed to create account',
      message: error.message 
    });
  }
});

// Login with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if user has password (might be Google-only user)
    if (!user.password) {
      return res.status(401).json({ error: 'Please use Google login for this account' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user info
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login',
      message: error.message 
    });
  }
});

export { router as authRouter };
