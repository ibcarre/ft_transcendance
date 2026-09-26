// check authentification API KEY ou access_token 
///v1/:username/games/
///v1/:username/games/:gamesnb
const jwt = require("jsonwebtoken");

exports.isLog = async (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json({message: "Unauthorized: No token"});
    try {
        var decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
        req.user = decoded.userId;
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            res.clearCookie('access_token');
            return (res.status(401).json({message: "Token Expired, please log back in"}));
        }
        if (error.name === "JsonWebTokenError") {
            res.clearCookie('access_token');
            return (res.status(401).json({message: "Wrong token, if you think this is an error, please log back in"}));
        }
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