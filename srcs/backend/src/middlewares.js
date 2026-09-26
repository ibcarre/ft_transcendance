// check authentification API KEY ou access_token 
///v1/:username/games/
///v1/:username/games/:gamesnb
const jwt = require("jsonwebtoken");

exports.isLog = async (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json({message: "Unauthorized: No token"});
    var decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
    req.user = decoded.userId;
    next();
};

exports.checkKey = function (req, res, next) {
    if (!req.query.api_key)
        return (res.status(403).send({message: "No API key"}));
    if (req.query.api_key !== process.env.API_KEY)
        return (res.status(403).send({message: "Wrong API_KEY"}))
    next();
};