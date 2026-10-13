const db = require('../../../db/db')
const { validationResult } = require("express-validator");

var edit_username = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: errors.array()[0]?.msg
      		});
    	}

		const userId = req.user.id;
		const newUsername = req.body?.username;
		if (!newUsername)
			throw (Error("ReportNotNullViolationError"))
		await db.none('UPDATE users SET name = $1 WHERE id = $2', [newUsername, userId])
		return (res.status(200).json({message: "Username Updated"}).redirect(req.originalUrl))
	}
	catch (error) {
		console.log("app=node ERROR: ", error)
		if (error.message === 'duplicate key value violates unique constraint "users_name_key"')
			return (res.status(409).json({ message: "Username already exists" }));
		if (error.routine === "ReportNotNullViolationError" || error.message === "ReportNotNullViolationError")
			return (res.status(409).json({ message: "Username can't be empty" }));
		return (res.status(500).json({message: "Server error"}));
	}
}

module.exports = edit_username
