const db = require('../../../db/db')
let path = require('path');
const {nanoid} = require('nanoid')
const {unlink} = require('node:fs');
//413 Request entity too large

var edit_picture = async (req, res) => {
	try {
		const image = req.files?.image;
		// If no image submitted, exit
		if (!image) return res.status(400).json({message: "No picture has been sent"});
		if (image?.size > 2000000)
			return (res.status(413).json({message: "Image shouldn't be bigger than 2MB"}));

		const imageTypeModule = await import('image-type');
		const imageType = imageTypeModule.default;
		const minimumBytes = imageTypeModule.minimumBytes;
		let imageName = image.name;
		imageName = nanoid() + imageName;
		const imagePath = path.join(__dirname, '..', '..', '..', '..', 'upload', imageName)
		console.log("app=node INFO: uploadedimagePath ", imagePath);
		await image.mv(imagePath);
		const readChunk = (await import('read-chunk')).readChunk;
		const buffer = await readChunk(imagePath, { length: minimumBytes });
		const isImage = await imageType(buffer);
		if (!isImage){
			console.log("app=node INFO: this is not an image")
			unlink(imagePath, (err) => {
				if (err) {
					throw(err);
				}
			});
			console.log("app=node INFO: fake image has been deleted");
			return (res.status(400).json({message: "This is not an image, please stick to classic images' file extensions (jpg, png, jpeg, webp...)"}))
		}
		const oldimagePath = path.join(__dirname, '..', '..', '..', '..', 'upload', req.user.avatar_url);
		unlink(oldimagePath, (err) => {
			if (err) {
				console.log('app=node ERROR: ', err);
			}
		});
		console.log("app=node INFO: this is an image")
		await db.none('UPDATE users SET avatar_url = $1 WHERE id = $2', [imageName, req.user.id]);
		return(res.status(200).json({message: "Profile picture changed"}));
	}
	catch (error) {
		console.log("app=node ERROR: ", error);
		return(res.status(500).send("Please retry this operation, and ensure an image is sent"));
	}
}

module.exports = edit_picture
