const env = require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const app = express()
const mongoURL = process.env.MONGODB_CONNECTION_STRING

app.use(express.json({extended: true}))

mongoose.connect(mongoURL)
	.then(() => {
		console.log('¡Conectado a Mongoose!')
	})
	.catch(e => {
		console.error('Error al conectar con MongoDB')
		console.error(e)
	})

const apiRouter = require('./Routes/api.js')
app.use('/api', apiRouter)

const ShortenedURL = require('./Models/ShortenedURL.js')
app.get('*', async (req, res, next) => {
	let shortenedURL = await ShortenedURL.findOne({
		pathname: req.originalUrl,
		expiredAt: {
			$gt: new Date()
		}
	})
	
	if (!shortenedURL) {
		return res.send('URL no encontrado')
	}

	return res.redirect(shortenedURL.url)
})

app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).json({
		message: err.message || 'Something bad happended'
	})
})

app.listen(process.env.APP_PORT, () => {
	console.log('¡App is running!')
})