const db = require('../../../db/db')
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

var edit_password = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: errors.array()[0]?.msg
      		});
    	}

		const userId = req.user.id;
		const newPass = req.body?.password;
		if (!newPass)
			throw (Error("ReportNotNullViolationError"))
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(newPass, saltRounds);
		await db.none('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId])
		return (res.status(200).json({message: "Password Updated"}).redirect(req.originalUrl))
	}
	catch (error) {
		console.log(error)
		if (error.routine === "ReportNotNullViolationError" || error.message === "ReportNotNullViolationError")
			return (res.status(409).json({ message: "Email can't be empty" }));
		return (res.status(500).json({message: "Server error"}));
	}
}

module.exports = edit_password
