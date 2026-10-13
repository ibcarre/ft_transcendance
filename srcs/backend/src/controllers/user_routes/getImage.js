const path = require('path');

var getImage = async (req, res) => {
	const image = req?.params?.image;
	console.log("app=node INFO: getting image");
	if (!image)
		return (res.status(400).json({message: "No picture asked for"}));
    const options = {
        root: path.join(__dirname, '..', '..', '..', 'upload')
    };

    const fileName = image;
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
}

//profile avec id

module.exports = getImage;
