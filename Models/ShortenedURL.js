const mongoose = require('mongoose');

const ShortenedURL = mongoose.Schema(
	{
		url: {
			type: String,
			required: true
		},
		namespace: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Namespace'
		},
		pathname: {
			type: String,
			required: true
		},
		timesUsed: {
			type: Number,
			default: 0
		},
		expiredAt: {
			type: Date,
			required: true
		}
	},
	{
		timestamps: true
	}
)

module.exports = mongoose.model('ShortenedURL', ShortenedURL)