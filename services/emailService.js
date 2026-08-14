const emailModule = require('../email');

module.exports = emailModule;
module.exports.sendEmail = emailModule.sendEmail || emailModule;
module.exports.sendEmailAsync = emailModule.sendEmailAsync || emailModule;
module.exports.notifyPaymentSuccess = emailModule.notifyPaymentSuccess || ((args) => emailModule(args.email, args.name));
