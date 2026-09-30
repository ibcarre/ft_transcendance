
var profile = async (req, res) => {
    return (res.status(200).send(req.user));
}

//profile avec id

module.exports = profile;
