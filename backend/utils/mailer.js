const nodemailer = require('nodemailer');

// --- 🚀 TESTED & VERIFIED GMAIL CONFIGURATION ---
// This uses the standard service configuration which proved to work in 3.3 seconds.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. Verification Email
const sendVerificationEmail = async (email, token) => {
    // Determine URL based on environment
    // When testing locally, use localhost. When deployed, use Vercel.
    const currentUrl = process.env.NODE_ENV === 'production' 
        ? 'https://future-fit.vercel.app' 
        : 'http://localhost:5000';

// const verificationUrl = `https://future-fit.vercel.app/index.html?verified=true&token=${token}`;
const verificationUrl = `http://localhost:5000/api/auth/verify?token=${token}`;


    const mailOptions = {
        from: `"Future-Fit Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Future-Fit: Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #667eea; text-align: center;">Welcome to Future-Fit!</h2>
                    <p style="color: #555; font-size: 16px;">Please click the button below to verify your email address and activate your account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" style="background-color: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">Verify My Email</a>
                    </div>
                    <p style="color: #999; font-size: 12px; text-align: center;">Link: ${verificationUrl}</p>
                </div>
            </div>
        `
    };

    console.log(`🔹 Sending verification email to: ${email}...`);
    // We use 'await' because 3 seconds is fast enough to wait for
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully!`);
};

// 2. Password Reset Email
const sendPasswordResetEmail = async (email, token) => {
    // const currentUrl = process.env.NODE_ENV === 'production' 
    //     ? 'https://future-fit.vercel.app' 
    //     : 'http://localhost:5000';
const resetUrl = `http://localhost:3000/reset-password.html?token=${token}`;

    // const resetUrl = `${currentUrl}/reset-password.html?token=${token}`;


    const mailOptions = {
        from: `"Future-Fit Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Future-Fit: Password Reset',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #e74c3c; text-align: center;">Reset Password</h2>
                    <p style="color: #555; font-size: 16px;">We received a request to reset your password. Click below to proceed.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #e74c3c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">Reset Password</a>
                    </div>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};