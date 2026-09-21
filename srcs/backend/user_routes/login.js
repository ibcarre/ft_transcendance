const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require('../db')

var login = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email || !password)
            return (res.status(400).json({ message: "Empty field(s)" }))
        const user = await db.one('SELECT * FROM users WHERE email = $1', email);
        if (!user)
            return (res.status(401).json({ message: "User doesn't exist" }));
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch)
            return (res.status(401).json({message: "Wrong password"}));
        const token = jwt.sign(
        { userId: user.id, username: user.name },
        process.env.JWT_SECRETKEY,
        { expiresIn: "1h"});
        res.cookie("access_token", token, { httpOnly: true, secure: true });
        return res.status(200).json({message: "Login Successful"});
    }
    catch (error) {
        console.log(error);
        return (res.status(500).send("Failed to log in\n"));
    }
}

module.exports = login