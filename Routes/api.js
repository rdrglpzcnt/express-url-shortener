const Router = require('express').Router()
const ShortenedURL = require('../Models/ShortenedURL.js')
const Namespace = require('../Models/Namespace.js')

// generar shortened
const randomstring = require('randomstring')
const makeRandomString = (
	length = 7,
	readable = true,
	charset = 'alphanumeric'
) => randomstring.generate({ length, readable, charset })



// make expiration date
const moment = require('moment')
const makeExpirationDate = (days = 0, hours = 0, minutes = 0) => {
	return moment().add({
		days,
		hours,
		minutes
	})
	.toDate()
}

const makeShortenedURLPathname = (shortened, namespace) => {
	return namespace
		? '/' + namespace + '/' + shortened
		: '/' + shortened
}

// returns string if invalid,
// returns true if valid
const validateBody = (body) => {
	let {
		url,
		length,
		readable,
		namespace
	} = body

	let urlRx = new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,=.]+$/)
	let alphanumericRegex = new RegExp(/^[a-z0-9]+$/i)

	// validar url
	if (!url || !urlRx.test(url)) {
		return '"url" is invalid'
	}

	// validar length
	if (length < 3 || length > 10) {
		return '"length" must be min 3 max 10'
	}

	// validar readable
	if (readable && typeof readable != 'boolean') {
		return '"readable must be boolean"'
	}

	// validar namespace
	if (namespace && (!alphanumericRegex.test(namespace) || namespace.length < 3 || namespace.length > 15)) {
		return '"namespace" must be a word between 3 and 15 characters long without signs'
	}
	
	return true
}

Router.post('/shorten', async (req, res, next) => {
	try {
		
		let valid = validateBody(req.body)
		
		if (typeof valid == 'string') {
			return res.status(422).json({
				message: valid
			})
		}
		
		let {
			url,
			length,
			readable,
			namespace
		} = req.body
	
		let randomized = makeRandomString(length, readable);

		let newShortenedURL = new ShortenedURL({
			url,
			// shortened,
			expiredAt: makeExpirationDate(0,0,1),
			pathname: makeShortenedURLPathname(randomized)
		})

		// handle namespace
		if (namespace) {
			
			let foundNamespace = await Namespace.findOne({name: namespace})
			
			if (foundNamespace) {
			
				newShortenedURL.namespace = foundNamespace._id
				newShortenedURL.pathname = makeShortenedURLPathname(randomized, foundNamespace.name)
				foundNamespace.shortenedURLs.push(newShortenedURL._id)
				await foundNamespace.save()
			
			} else {
			
				let newNamespace = await Namespace.create({
					name: namespace
				})
				newNamespace.shortenedURLs.push(newShortenedURL._id)
				newShortenedURL.pathname = makeShortenedURLPathname(randomized, newNamespace.name)
				newShortenedURL.namespace = newNamespace._id
				await newNamespace.save()
			
			}

		}

		await newShortenedURL.save()
		
		return res.json(newShortenedURL)

	} catch(e) {
		return next(e)
	}
})

Router.get('/shortened/:id', async (req, res, next) => {
	try {
		let shortenedURL = await ShortenedURL.findById(req.params.id);

		if (shortenedURL) {
			++shortenedURL.timesUsed
			await shortenedURL.save()
			return res.json(shortenedURL)
		}

		return res.status(404).json({ message: 'Not Found' })
	} catch(e) {
		return next(e)
	}
})

Router.delete('/shortened/:id', async (req, res, next) => {
	try {
		let shortenedURL = await ShortenedURL.findById(req.params.id)
		
		if (shortenedURL) {
			await shortenedURL.remove()
			return res.json({message: 'URL eliminado'})
		} else {
			return next()
		}
	} catch(e) {
		return next(e)
	}
})

Router.put('/shortened/:id/expire', async (req, res, next) => {
	try {
		let shortenedURL = await ShortenedURL.findById(req.params.id)
		
		if (shortenedURL) {

			if (shortenedURL.expiredAt < new Date()) {
				return res.status(422).json({ message: 'El URL ya está expirado' })
			}

			shortenedURL.expiredAt = new Date()
			await shortenedURL.save()
			// await shortenedURL.remove()
			return res.json({message: 'URL expirado'})
		} else {
			return next()
		}
	} catch(e) {
		return next(e)
	}
})


module.exports = Router