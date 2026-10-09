const { body } = require("express-validator");

const userDataValidate = [
  body("username")
    .exists()
    .withMessage("User name is required")
    .isString()
    .withMessage("User name should be string")
    .isLength({ min: 4, max: 24 })
    .withMessage("Password should be at least 2 characters and 24 characters max")
	.matches(/^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/)
	.withMessage("Username should start with a letter and only have lowercase/uppercase letters, numbers or special characters -_"),
  body("password")
    .exists()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password should be string")
    .isLength({ min: 8, max: 64 })
    .withMessage("Password should be at least 8 characters and 64 characters max")
	.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,64}$/)
	.withMessage("Password should have one special character, at least one uppercase letter, at least one lowercase letter and at least one number"),
  body("email").exists().isEmail().withMessage("Provide valid email"),
];

const emailValidate = [
  body("email").exists().isEmail().withMessage("Provide valid email"),
];

const usernameValidate = [
  body("username")
    .exists()
    .withMessage("User name is required")
    .isString()
    .withMessage("User name should be string")
    .isLength({ min: 4, max: 24 })
    .withMessage("Password should be at least 2 characters and 24 characters max")
	.matches(/^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/)
	.withMessage("Username should start with a letter and only have lowercase/uppercase letters, numbers or special characters -_"),
];

const passwordValidate = [
  body("password")
    .exists()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password should be string")
    .isLength({ min: 8, max: 64 })
    .withMessage("Password should be at least 8 characters and 64 characters max")
	.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,64}$/)
	.withMessage("Password should have one special character, at least one uppercase letter, at least one lowercase letter and at least one number"),
];

module.exports = {userDataValidate, emailValidate, usernameValidate, passwordValidate};
