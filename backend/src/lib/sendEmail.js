import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config(); 

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, 
        port: parseInt(process.env.EMAIL_PORT, 10), 
        secure: process.env.EMAIL_PORT === '465', 
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS, 
        },
        // tls: {
        //   rejectUnauthorized: false
        // }
    });

    
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_EMAIL}>`,
        to: options.email,          
        subject: options.subject,   
        text: options.message,     
        // html: options.html,    
    };

    // 3. Thực sự gửi email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        
        return info; 
    } catch (error) {
        console.error('Error sending email: ', error);
       
        throw new Error('Email could not be sent. Please try again later.');
    }
};

export default sendEmail;