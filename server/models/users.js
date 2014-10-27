var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var UserSchema = new mongoose.Schema({
  	first_name:  String,
  	last_name:  String,
  	email: String,
  	password: String,
  	date: { type: Date, default: Date.now },
  	hidden: Boolean,
});

UserSchema.path('first_name').required(true, 'First name field cannot be blank');
UserSchema.path('last_name').required(true, 'Last name field cannot be blank');
UserSchema.path('email').required(true, 'Email field cannot be blank');
UserSchema.path('password').required(true, 'Password field cannot be blank');
mongoose.model('User', UserSchema);