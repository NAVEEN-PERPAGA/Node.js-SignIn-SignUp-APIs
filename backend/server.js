const express = require("express");
const app = express();

jwt = require("jsonwebtoken");
require("dotenv").config();
var mongoose = require("mongoose");
var bcrypt = require("bcrypt");
var saltRounds = 10;
var validator = require("validator")

app.use(express.json());

const utils = require("./utils");
var User = require("./models/User");
var ResetPassword = require("./models/ResetPassword");

const nodemailer = require("nodemailer");

port = process.env.PORT || 5000;

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});
const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDb Connection successful on prokart app");
});

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.use((req, res, next) => {
  var token = req.headers["authorization"];
  if (!token) return next();

  token = token.replace("Bearer ", "");
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        error: true,
        message: "invalid user",
      });
    } else {
      req.user = user;
      next();
    }
  });
});

// SIGNUP

app.post("/signup", async (req, res) => {
  var newUser = new User({
    name: req.body.name,
    password: req.body.password,
    email: req.body.email,
  });

  var is_valid = true, message;

  var is_email_valid = validator.isEmail(newUser.email);

  if (/^(?=.*[A-Za-z])/.test(newUser.password) === false) {
    message = "Password must contain a letter";
    is_valid = false;
  } else if (/^(?=.*\d)/.test(newUser.password) === false) {
    message = "Password must have a digit";
    is_valid = false;
  } else if (/^(?=.*[@$!%*#?&])/.test(newUser.password) === false) {
    message = "Password must have a Special Character";
    is_valid = false;
  } else if (/^[A-Za-z\d@$!%*#?&]{8,}$/.test(newUser.password) === false) {
    message = "Password must be 8 Characters Long";
    is_valid = false;
  } else if (is_email_valid === false) {
    message = "Please Enter a Valid Email";
    is_valid = false;
  }

  if (is_valid) {
    await User.findOne({ email: newUser.email })
      .then(async (profile) => {
        if (!profile) {
          bcrypt.hash(newUser.password, saltRounds, async (err, hash) => {
            if (err) {
              console.log("Error is", err.message);
            } else {
              newUser.password = hash;
              await newUser
                .save()
                .then(() => {
                  res.status(200).json({ message: "New User Created !", newUser, status: "200 OK" });
                })
                .catch((err) => {
                  console.log("Error is ", err.message);
                });
            }
          });
        } else {
          res.status(409).json({message: "User already exists...", status: "409 ALREADY EXISTS"});
        }
      })
      .catch((err) => {
        console.log("Error is", err.message);
      });
  } else {
    res.json(message);
  }
});

//   SIGNIN

app.post("/login", async (req, res) => {
  var newUser = {};
  newUser.name = req.body.name;
  newUser.password = req.body.password;
  newUser.email = req.body.email;

  await User.findOne({ email: newUser.email })
    .then((profile) => {
      if (!profile) {
        res.status(404).json({message: "User does not exist", status: "404 NOT FOUND"});
      } else {
        bcrypt.compare(
          newUser.password,
          profile.password,
          (err, result) => {
            if (err) {
              console.log("Error is", err.message);
            } else if (result === true) {
              const token = utils.generateToken(newUser);
              res.status(200).json({ token, message: "User Aunthenticated", status: "200 OK" });
            } else {
              res.status(400).json("User Unauthorized Access");
            }
          }
        );
      }
    })
    .catch((err) => {
      console.log("Error is ", err.message);
    });
});

// RESET PASSWORD

app.post("/reset_password", (req, res) => {
  var email = req.body.email;
  var new_password = req.body.new_password

  var is_valid = true, message;

  if (/^(?=.*[A-Za-z])/.test(new_password) === false) {
    message = "Password must contain a letter";
    is_valid = false;
  } else if (/^(?=.*\d)/.test(new_password) === false) {
    message = "Password must have a digit";
    is_valid = false;
  } else if (/^(?=.*[@$!%*#?&])/.test(new_password) === false) {
    message = "Password must have a Special Character";
    is_valid = false;
  } else if (/^[A-Za-z\d@$!%*#?&]{8,}$/.test(new_password) === false) {
    message = "Password must be 8 Characters Long";
    is_valid = false;
  }

  if (is_valid) {
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        res.json("User not found");
      }

      bcrypt.hash(new_password, saltRounds, async (err, hash) => {
        if (err) {
          console.log("Error is", err.message);
        } else {
          user.password = hash;
          await user.save()
            .then(() => {
              res.json({ message: "You have Reset your password successfully !", user });
            })
            .catch((err) => {
              console.log("Error is ", err.message);
            });
        }
      });

      // user.password = req.body.new_password;
      // user
      //   .save()
      //   .then(
      //     res.json({
      //       message: "You have Reset your password successfully",
      //       user,
      //     })
      //   )
      //   .catch((err) => res.json(err));
    })
    .catch((err) => {
      console.log(`Error is ${err}`);
    });
  }
  else {
    res.json(message)
  }
});

// FORGET PASSWORD

app.post("/reset-password", function (req, res) {
  const email = req.body.email;
  User.findOne(
    { email: email } //checking if the email address sent by client is present in the db(valid)
  ).then((user) => {
    if (!user) {
      res.send("No user found with that email address.");
    }
    // ResetPassword.findOne({
    //   where: { userId: user.id },
    // }).then(function (resetPassword) {
    //   if (resetPassword)
    //     resetPassword.destroy({
    //       where: {
    //         id: resetPassword.id,
    //       },
    //     });
    //   token = crypto.randomBytes(32).toString("hex"); //creating the token to be sent to the forgot password form (react)
    //   bcrypt.hash(token, null, null, function (err, hash) {
    //hashing the password to store in the db node.js
    ResetPassword.create({
      //   userId: user.id,
      resetPasswordToken: "testing",
      //   expire: moment.utc().add(config.tokenExpiry, "seconds"),
    }).then(function (item) {
      if (!item) res.send("Oops problem in creating new password record");
      let mailOptions = {
        from: '"<jyothi pitta>" jyothi.pitta@ktree.us',
        to: user.email,
        subject: "Reset your account password",
        html:
          "<h4><b>Reset Password</b></h4>" +
          "<p>To reset your password, complete this form:</p>" +
          "<a href=" +
          //   config.clientUrl +
          "reset/" +
          //   user.id +
          "/" +
          //   token +
          '">' +
          //   config.clientUrl +
          "reset/" +
          //   user.id +
          "/" +
          //   token +
          "</a>" +
          "<br><br>" +
          "<p>--Team</p>",
      };

      let testAccount = nodemailer.createTestAccount();

      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });

      // send mail with defined transport object
      // let info = await transporter.sendMail({
      //     from: '"Fred Foo 👻" <foo@example.com>', // sender address
      //     to: "bar@example.com, baz@example.com", // list of receivers
      //     subject: "Hello ✔", // Subject line
      //     text: "Hello world?", // plain text body
      //     html: "<b>Hello world?</b>", // html body
      // });

      let mailSent = transporter.sendMail(mailOptions); //sending mail to the user where he can reset password.User id and the token generated are sent as params in a link
      if (mailSent) {
        return res.json({
          success: true,
          message: "Check your mail to reset your password.",
        });
      } else {
        return throwFailed(error, "Unable to send email.");
      }
    });
    //   });
    // });
  });
});

app.post("/resetPassword", (req, res) => {
  var RP = new ResetPassword({
    resetPasswordToken: req.body.rp,
  });
  RP.save().then(res.send(RP));
});

const server = app.listen(3000, () => {
  console.log(`Server is Running on Port ${server.address().port}`);
});
