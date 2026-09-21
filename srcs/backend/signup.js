const express = require('express');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require('./db')

var signup = async (req, res) => {
    try { 
        const {username, email, password} = req.body;
        if (!username || !password || !email) {
            return res.status(400).json({ message: "Please Input Username, Password and Email Adress" });
        }
        var user = await db.oneOrNone('SELECT name FROM users WHERE name = $1', username);
        if (user) return res.status(400).json({ message: "Username already exists" });
        user = await db.oneOrNone('SELECT name FROM users WHERE email = $1', email)
        if (user) return res.status(400).json({ message: "Email already exists" });
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        user = await db.one('INSERT INTO users VALUES(DEFAULT, $(email), $(name), $(password)) RETURNING *', {
        email: email,
        name: username,
        password: hashedPassword
        });
        const token = jwt.sign(
        { userId: user._id, username: user.username },
        process.env.SECRET_KEY || "1234!@#%<{*&)",
        { expiresIn: "1h" });
        return res.status(201).json({message: "User successfully created\n", data: user, token});
    } catch (error) {
        console.log(error);
        return (res.status(500).json({message: "Failed to create user\n"}));
    }
}

module.exports = signup;