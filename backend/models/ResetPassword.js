var mongoose = require('mongoose')


const ResetPasswordSchema = mongoose.Schema({
    resetPasswordToken: {type:String, require: true}
})

module.exports = resetPassword = mongoose.model('ResetPassword', ResetPasswordSchema)