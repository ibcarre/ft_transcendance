const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require('../../db/db')

var login = async (req, res) => {
    try {
		const to = req.cookies.access_token;
        const {email, password} = req.body;
		if (to)
			res.clearCookie('access_token');
        if (!email || !password)
            return (res.status(400).json({ message: "Empty field(s)" }))
        const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', email);
		if (!user)
			return (res.status(401).json({ message: "User doesn't exist" }));
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch)
            return (res.status(401).json({message: "Wrong password"}));
		await db.none('UPDATE users SET status = $1 WHERE id = $2', ['online', user.id]);
        const token = jwt.sign(
        { userId: user.id, username: user.name },
        process.env.JWT_SECRETKEY,
        { expiresIn: "1w"});
        res.cookie("access_token", token, { httpOnly: true, secure: true });
        return res.status(200).json({message: "Login Successful"});
    }
    catch (error) {
        console.log("app=node ERROR: ", error);
        if (error.received === 0)
            return (res.status(401).json({ message: "User doesn't exist" }));
        return (res.status(500).send("Failed to log in"));
    }
}

module.exports = login
