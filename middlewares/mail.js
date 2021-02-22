var nodemailer   = require('nodemailer');
var configGlobal = require('../config/global.json');
var configMail   = require('../config/mail.json');

class Mail {
    constructor(from, to) {
        this.transporter = nodemailer.createTransport(configMail[configGlobal.environment]);
        this.from = from;
        this.to = to;
    }

    sendMail(subject, content) {
        var mailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            text: content
        };

        this.transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
}

module.exports = {
    Mail
};