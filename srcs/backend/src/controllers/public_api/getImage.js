const db = require('../../db/db')
const path = require('path');

module.exports = async (req, res) => {
    try {
        const userId = req?.params?.userId;
        const image = await db.any('SELECT avatar_url FROM users WHERE id = $1', userId);
        if (!image)
            return (res.status(400).json({message: "No picture asked for"}));
        console.log("app=node INFO: getting image", image.avatar_url);
        const options = {
            root: path.join(__dirname, '..', '..', '..', 'upload')
        };
        console.log(options);
        const fileName = image[0]?.avatar_url;
        res.status(200).sendFile(fileName, options, function (err) {
            if (err) {
                console.error('Error sending file:', err);
                res.status(404).sendFile("default_pic.jpg", options, function (err) {
                    res.status(500).json({message: "File error"});
                });
            } else {
                console.log('app=node INFO: Sent:', fileName);
            }
        });
    } catch (e) {
            console.log(e);
            res.status(500).json({message: "Server Error"});
    }
}