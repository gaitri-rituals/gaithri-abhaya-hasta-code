const { validationResult } = require('express-validator');

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      success: false,
      message: errorMessages[0],
      errors: errorMessages
    });
  }
  next();
};

module.exports = {
  checkValidation
};