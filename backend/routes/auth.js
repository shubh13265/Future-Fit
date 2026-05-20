const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Ensure filename is lowercase 'user'
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;

    // 1. Validation
    if (!name || !email || !password || !role) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    try {
        // 2. Check existing user
        let user = await User.findOne({ email: email });
        if (user) {
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }

        // 3. Create User
        user = new User({
            name,
            email,
            password,
            role,
            verificationToken: crypto.randomBytes(20).toString('hex'),
            isVerified: false
        });

        // 4. Hash Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 5. Save User
        await user.save();
        console.log("✅ User saved to DB");

        // 6. Send Email (WAIT for it to finish)
        try {
            await sendVerificationEmail(user.email, user.verificationToken);
            console.log("✅ Email sent successfully");
            
            res.status(201).json({ 
                msg: 'Registration successful! Please check your email to verify your account.' 
            });
        } catch (emailError) {
            console.error("❌ Email Sending Failed:", emailError.message);
            
            // If email fails, delete the user so they can try again with a correct email
            await User.findByIdAndDelete(user.id);
            
            return res.status(500).json({ 
                msg: 'Failed to send verification email. Please check the email address and try again.' 
            });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/signin
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Please enter all fields.' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials. User not found.' });

        if (!user.isVerified) {
            return res.status(401).json({ msg: 'Account not verified. Please check your email.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials. Password incorrect.' });

        const payload = { user: { id: user.id, name: user.name, role: user.role } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        // Security: Don't reveal if user exists
        if (!user) return res.json({ msg: 'If your email is registered, a reset link has been sent.' });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // Send Email (WAIT for it)
        try {
            await sendPasswordResetEmail(user.email, resetToken);
            res.json({ msg: 'If your email is registered, a reset link has been sent.' });
        } catch (error) {
            console.error("❌ Email Failed:", error.message);
            return res.status(500).json({ msg: 'Failed to send email.' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ msg: 'Token is invalid or has expired.' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();
        res.json({ msg: 'Password reset successful! You can now log in.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth/verify
router.get('/verify', async (req, res) => {
    try {
        const token = req.query.token;
        const user = await User.findOne({ verificationToken: token });
        if (!user) return res.status(400).send('Invalid token.');

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        // Redirect to Vercel
        // res.redirect('https://future-fit.vercel.app/index.html?verified=true');
        res.redirect('http://localhost:3000/index.html?verified=true');

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/resend
router.post('/resend', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.isVerified) return res.status(400).json({ msg: 'Invalid request.' });

        user.verificationToken = crypto.randomBytes(20).toString('hex');
        await user.save();
        await sendVerificationEmail(user.email, user.verificationToken);
        
        res.json({ msg: 'Verification link resent.' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;