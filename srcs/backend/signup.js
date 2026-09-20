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
        db.oneOrNone('SELECT name FROM users WHERE name = $1', username).then(data => {
            if (data)
                return res.status(400).json({ message: "User Already Exists" });
        }).catch(error => {
            console.log('ERROR:', error); // print the error;
        });
        db.oneOrNone('SELECT name FROM users WHERE email = $1', email).then(data => {
            if (data)
                return res.status(400).json({ message: "User Already Exists" });
        }).catch(error => {
            console.log('ERROR:', error); // print the error;
        });
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await db.none('INSERT INTO users VALUES(DEFAULT, $(email), $(name), $(password))', {
        email: email,
        name: username,
        password: hashedPassword
        }).catch(error => {
            console.log('ERROR:', error); // print the error;
            return res.status(400).send("Tu floppes\n");
        });
    } catch (error) {
        console.log(error);
        return (res.status(400));
    }
    return res.status(201).json({message: "User successfully created\n"});
}

module.exports = signup;