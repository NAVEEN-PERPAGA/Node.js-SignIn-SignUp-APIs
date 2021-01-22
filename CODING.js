var validator = require('validator');


var password = '1234ab%a'
var is_valid = true, message

var is_email_valid = validator.isEmail("abcd@gmail.com")

if (/^(?=.*[A-Za-z])/.test(password) === false) {
    message = "Password must contain a letter"
}

else if (/^(?=.*\d)/.test(password) === false) {
    message = "Password must have a digit"
}

else if (/^(?=.*[@$!%*#?&])/.test(password) === false) {
    message = "Password must have a Special Character"
    is_valid = false
}

else if (/^[A-Za-z\d@$!%*#?&]{8,}$/.test(password) === false) {
    message = "Password must be 8 Characters Long"
}
else if (is_email_valid === false) {
    message = "Please Enter a Valid Email"
}

else {
    message = "correct"
}


console.log(message, is_valid)