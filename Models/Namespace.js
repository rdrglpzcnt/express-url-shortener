const mongoose = require('mongoose');

const Namespace = mongoose.Schema(
	{
		name: {
			type: String,
			required: true
		},
		shortenedURLs: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ShortenedURL'
		}]
	},
	{
		timestamps: true
	}
)

module.exports = mongoose.model('Namespace', Namespace)