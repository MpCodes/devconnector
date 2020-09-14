const express = require('express');
const User = require('../../models/User');
const router = express.Router();
const {
	check,
	validationResult
} = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require("config");

// @route   POST api/users
// @desc    Register user
// @access  Public

//POST BUT VALIDATE KWANZA
router.post('/', [check('name', 'Name is required').not().isEmpty(), check('email', 'Please include a valid email').isEmail(), check('password', 'Please enter a password with 6 or more characters').isLength({
	min: 6
})], async (req, res) => {
	const errors = validationResult(req);
	//return errors in an array
	if (!errors.isEmpty()) {
		return res.status(400).json({
			errors: errors.array()
		});
	}

	//destructuring i.e instead of using req.body.name === name
	const {
		name,
		email,
		password
	} = req.body;

	// Handle logic issues
	try {
		// See if user exists
		let user = await User.findOne({
			email
		});

		if (user) {
			return res.status(400).json({
				errors: [{
					msg: 'User already exists'
				}]
			});
		}

		// Get users gravatar
		const avatar = gravatar.url(email, {
			s: '200',
			r: 'pg',
			d: 'mm'
		})

		//User object to be saved
		user = new User({
			name,
			email,
			avatar,
			password
		});

		// Encrypt password
		const salt = await bcrypt.genSalt(10);

		user.password = await bcrypt.hash(password, salt);

		//save to mongoDB
		await user.save();

		//generate payload for jwt
		const payload = {
			user: {
				id: user.id
			}
		};

		//sign the jwt payload then return a token after save
		jwt.sign(payload, config.get("jwtSecret"), {
			expiresIn: 360000
		}, (err, token) => {
			if (err) throw err
			res.json({
				token
			});
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	}
});

module.exports = router;