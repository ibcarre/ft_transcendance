// check authentification API KEY ou access_token 
///v1/:username/games/
///v1/:username/games/:gamesnb
const jwt = require("jsonwebtoken");
const db = require('../db/db');

exports.isLog = async (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json({message: "Unauthorized: No token"});
    try {
        var decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
        var user = await db.oneOrNone('SELECT * FROM users WHERE id = $1', decoded.userId);
        console.log("Auth");
        if (!user) {
            res.clearCookie('access_token');
            return (res.status(401).json({message: "Unauthorized: User doesn't exist"}))
        }
        req.user = user;
    }
    catch (error) {
        console.log(error);
        res.clearCookie('access_token');
        if (error.name === "TokenExpiredError") {
            return (res.status(401).json({message: "Token Expired, please log back in"}));
        }
        if (error.name === "JsonWebTokenError") {
            return (res.status(401).json({message: "Wrong token, if you think this is an error, please log back in"}));
        }
        return res.status(401).json({message: "Unauthorized"});
    }
    next();
};

exports.checkKey = function (req, res, next) {
    if (!req.query.api_key)
        return (res.status(403).send({message: "No API key"}));
    if (req.query.api_key !== process.env.API_KEY)
        return (res.status(403).send({message: "Wrong API_KEY"}))
    next();
};