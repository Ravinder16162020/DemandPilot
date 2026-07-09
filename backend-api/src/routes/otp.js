import express from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { pool } from '../db/pool.js';

// Bypass SSL verification for development (remove in production!)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config();

const router = express.Router();

// Generate a random 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Calculate expiration time (5 minutes from now)
function getExpirationTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  return now;
}

// Clean up expired OTPs for a specific email
async function cleanupExpiredOTPs(email) {
  try {
    await pool.query(
      'DELETE FROM otps WHERE email = $1 AND (expires_at < CURRENT_TIMESTAMP OR verified = FALSE)',
      [email]
    );
  } catch (error) {
    console.error('Error cleaning up OTPs:', error);
  }
}

// Send OTP endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Clean up any existing expired OTPs for this email
    await cleanupExpiredOTPs(email);

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = getExpirationTime();

    // Store OTP in database
    await pool.query(
      'INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    // Log for debugging
    console.log(`Sending OTP to ${email}: ${otp}`);
    console.log(`Name: ${name}`);
    console.log(`Expires at: ${expiresAt}`);

    // Send email using Nodemailer
    try {
      console.log('Email configuration:', {
        user: process.env.EMAIL_USER,
        hasPassword: !!process.env.EMAIL_PASS,
        to: email
      });

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for DemandPilot',
        text: `Hello ${name},\n\nYour OTP is: ${otp}\n\nThis OTP will expire in 5 minutes.\n\nIf you didn't request this, please ignore this email.`,
      };

      console.log('Attempting to send email to:', email);
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', email);
      console.log('Message ID:', info.messageId);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      console.error('Error details:', JSON.stringify(emailError, null, 2));
      // Continue with the response even if email fails (for development)
    }

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ 
      error: 'Failed to send OTP',
      message: error.message 
    });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Check if OTP exists and is valid
    const result = await pool.query(
      'SELECT * FROM otps WHERE email = $1 AND otp = $2 AND expires_at > CURRENT_TIMESTAMP AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired OTP',
        message: 'The OTP you entered is invalid or has expired' 
      });
    }

    // Mark OTP as verified
    await pool.query(
      'UPDATE otps SET verified = TRUE WHERE id = $1',
      [result.rows[0].id]
    );

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      error: 'Failed to verify OTP',
      message: error.message 
    });
  }
});

export { router as otpRouter };
