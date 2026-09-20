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
        const user = db.oneOrNone('SELECT name FROM users WHERE name = $1', username);
        if (user) return res.status(400).json({ message: "Username already exists" });
        user = db.oneOrNone('SELECT name FROM users WHERE email = $1', email)
        if (user) return res.status(400).json({ message: "Email already exists" });
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await db.none('INSERT INTO users VALUES(DEFAULT, $(email), $(name), $(password))', {
        email: email,
        name: username,
        password: hashedPassword
        });
        return res.status(201).json({message: "User successfully created\n"});
    } catch (error) {
        console.log(error);
        return (res.status(400));
    }
}

module.exports = signup;