const nodemailer = require('nodemailer');

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email function
const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Gaitri Temple Management" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Generate temple admin credentials email template
const generateTempleAdminCredentialsEmail = (templeName, email, password, loginUrl) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Temple Admin Account Created</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b35; }
            .button { display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🕉️ Welcome to Gaitri Temple Management</h1>
                <p>Your temple admin account has been created successfully</p>
            </div>
            <div class="content">
                <h2>Dear Temple Administrator,</h2>
                <p>Congratulations! Your temple "<strong>${templeName}</strong>" has been successfully registered with our Gaitri Temple Management System.</p>
                
                <div class="credentials-box">
                    <h3>🔐 Your Login Credentials</h3>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Temporary Password:</strong> <code style="background: #f1f1f1; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
                </div>

                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong>
                    <ul>
                        <li>Please change your password immediately after your first login</li>
                        <li>Keep your credentials secure and do not share them</li>
                        <li>This temporary password will expire in 7 days</li>
                    </ul>
                </div>

                <p>You can now access your temple management dashboard to:</p>
                <ul>
                    <li>Manage temple services and pujas</li>
                    <li>Handle bookings and appointments</li>
                    <li>Manage staff and volunteers</li>
                    <li>Track donations and expenses</li>
                    <li>Organize events and festivals</li>
                </ul>

                <div style="text-align: center;">
                    <a href="${loginUrl}" class="button">🚀 Access Your Dashboard</a>
                </div>

                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                
                <div class="footer">
                    <p>Best regards,<br>
                    <strong>Gaitri Temple Management Team</strong></p>
                    <p>📧 admin@gaitri.com | 🌐 www.gaitri.com</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p><em>This is an automated message. Please do not reply to this email.</em></p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to Gaitri Temple Management System!

Your temple "${templeName}" has been successfully registered.

Login Credentials:
Email: ${email}
Temporary Password: ${password}

Important: Please change your password immediately after your first login.

Access your dashboard: ${loginUrl}

Best regards,
Gaitri Temple Management Team
admin@gaitri.com
  `;

  return { htmlContent, textContent };
};

// Send temple admin credentials email
const sendTempleAdminCredentials = async (templeName, email, password) => {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080/gaitri/temples';
  const { htmlContent, textContent } = generateTempleAdminCredentialsEmail(templeName, email, password, loginUrl);
  
  const subject = `🕉️ Welcome to Gaitri - Your Temple Admin Account is Ready!`;
  
  return await sendEmail(email, subject, htmlContent, textContent);
};

module.exports = {
  sendEmail,
  sendTempleAdminCredentials,
  generateTempleAdminCredentialsEmail
};