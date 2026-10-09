const db = require('../../../db/db')

var edit_email = async (req, res) => {
	try {
		const userId = req.user.id;
		const newMail = req.body?.email;
		if (!newMail)
			throw (Error("ReportNotNullViolationError"))
		await db.none('UPDATE users SET email = $1 WHERE id = $2', [newMail, userId])
		return (res.status(200).json({message: "Email Updated"}).redirect(req.originalUrl))
	}
	catch (error) {
		console.log(error)
		if (error.message === 'duplicate key value violates unique constraint "users_email_key"')
			return (res.status(409).json({ message: "Email already exists" }));
		if (error.routine === "ReportNotNullViolationError" || error.message === "ReportNotNullViolationError")
			return (res.status(409).json({ message: "Email can't be empty" }));
		return (res.status(500).json({message: "Server error"}));
	}
}

module.exports = edit_email
