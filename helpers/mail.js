const nodemailer = require("nodemailer");

async function sendMail(to, subject, html,attachments) {
  /* Transporter */
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST ,
    port: process.env.MAIL_PORT ,
    secure: false,
    auth: {
      user: process.env.MAIL_USER ,
      pass: process.env.MAIL_PASS ,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // /* Send mail */'"Join-Us" <contact@join-us.fr>'
  try {    
    
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments      
    });
    console.log(info);
  } catch (e) {
    console.log(e);
  }
}

module.exports = sendMail;
