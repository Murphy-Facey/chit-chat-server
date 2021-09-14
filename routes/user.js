const router = require("express").Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { passwordStrength } = require("check-password-strength");

var jsonParser = bodyParser.json();

const User = require("../models/User");
const Profile = require("../models/Profile");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

router.post("/", jsonParser, (req, res) => {
  let { pageNumber, searchInput, id } = req.body;
  Profile.count(
    {
      user_id: { $ne: id },
      first_name: { $regex: new RegExp(`^${searchInput}`, "i") },
    },
    (err, count) => {
      // console.log(searchInput);

      Profile.find({
        user_id: { $ne: id },
        first_name: { $regex: new RegExp(`^${searchInput}`, "i") },
      })
        .limit(7)
        .skip((pageNumber - 1) * 7)
        .exec(async (err, profiles) => {
          // console.log(profiles);
          const users = await Promise.all(
            profiles.map(async ({ user_id, first_name, last_name }) => {
              let user = await User.findOne({ _id: user_id });

              if (user) {
                return {
                  _id: user._id,
                  username: user.username,
                  firstName: first_name,
                  lastName: last_name,
                };
              }
            })
          );
          return res
            .status(200)
            .send({ users, count, pageNumber, searchInput });
        });
    }
  );
});

router.post("/contacts/new", jsonParser, (req, res) => {
  let { user_id, contact_id } = req.body;
  // console.log(user_id);
  Profile.updateOne(
    { user_id },
    { $addToSet: { contacts: contact_id } },
    (err, result) => {
      console.log(result + "heu, there");
    }
  );

  Profile.updateOne(
    { user_id: contact_id },
    { $addToSet: { contacts: user_id } },
    (err, result) => {
      console.log(result);
    }
  );

  res.status(200).send({ msg: "something" });
});

router.post("/contacts/all", jsonParser, (req, res) => {
  Profile.findOne({ user_id: req.body.user_id }, async (err, profile) => {
    let result = await Promise.all(
      profile.contacts.map(async (contact_id) => {
        let chat = await Chat.findOne({ user_ids: { $in: [contact_id] } });
        let info = await Profile.findOne({ user_id: contact_id });

        if (chat != null) {
          let message = await Message.find({ chat_id: chat._id })
            .sort({ date_sent: -1 })
            .limit(1)
            .exec();

          if (message.length != 0) {
            return {
              _id: info.user_id,
              firstName: info.first_name,
              lastName: info.last_name,
              latestMessage: {
                message: message[0].message,
                dateSent: message[0].date_sent,
              },
              isOnline: false,
            };
          }
        }

        return {
          _id: info.user_id,
          firstName: info.first_name,
          lastName: info.last_name,
          latestMessage: {
            message: "😄 Send first message ",
            dateSent: null,
          },
          isOnline: false,
        };
      })
    );
    // console.log(result);
    return res.status(200).send(result);
  });
});

router.post("/chat/new", jsonParser, (req, res) => {
  let { userId, contactId } = req.body;

  Chat.findOne({ user_ids: { $all: [userId, contactId] } }, (err, chat) => {
    if (err) return console.log(err);

    if (chat) {
      return res.status(200).send({ chatId: chat._id });
    }

    let mewChat = new Chat({
      user_ids: [userId, contactId],
      chat_name: "Default Chat",
    });

    mewChat.save().then(({ _id }) => {
      return res
        .status(200)
        .send({ msg: "Chat was successfully added", chatId: _id });
    });
  });
});

router.post("/message/all", jsonParser, (req, res) => {
  Message.find({ chat_id: req.body.chatId }, (err, messages) => {
    if (err) console.log(err);

    let newMessages = messages.map(
      ({ date_sent, user_id, chat_id, message }) => {
        return {
          dateSent: date_sent,
          userId: user_id,
          chatId: chat_id,
          message,
        };
      }
    );

    return res.status(200).send(newMessages);
  });
});

router.post("/register", jsonParser, (req, res) => {
  try {
    let { username, password, firstName, lastName } = req.body;

    if (!(username && password && firstName && lastName)) {
      return res.status(401).send({
        fields: ["firstName", "lastName", "password", "username"],
        msg: "All the inputs are required "
      });
    }

    User.findOne({ username }, (err, result) => {
      if (err) return console.log(err);

      if (result) return res.status(409).send({
        fields: ["username"],
        msg: "A user with the username, " +  username + ", already exists "
      });

      if(password.length < 8 || password.length > 25) {
        return res.status(400).send({
          fields: ["password"],
          msg: "This password does not meet the length requirements"
        });
      }

      let pStrength = passwordStrength(password);
      if(pStrength.value == "Too weak" || pStrength.value == "Weak") {
        return res.status(400).send({
          fields: ["password"],
          msg: "This password does not meet the strength requirments"
        });
      }

      bcrypt.hash(password, 10).then((hashedPassword) => {
        let user = new User({ username, password: hashedPassword });
        let profile = new Profile({
          user_id: user._id,
          first_name: firstName,
          last_name: lastName,
        });

        user.save((err) => {
          if (err) return res.status(400).send({ error: err });

          profile.save();

          return res
            .status(200)
            .send({ msg: "User was successfully added. ", success: true });
        });
      });
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/login", jsonParser, (req, res) => {
  try {
    const { username, password } = req.body;

    if (!(username && password)) {
      return res.status(400).send({
        fields: ["username", "password"],
        msg: "All inputs are required"
      });
    }

    User.findOne({ username }, (err, user) => {
      if(err) return console.log(err);

      if(!user) return res.status(404).send({
        fields: ["username"],
        msg: "User with username, " + username + ", doesn't exists"
      });

      bcrypt.compare(password, user.password, async (err, success) => {
        if (err) return;

        if (success) {
          let { first_name, last_name } = await Profile.findOne({
            user_id: user._id,
          });
          
          const token = jwt.sign(
            {
              userId: user._id,
              username,
            },
            process.env.TOKEN_SECRET,
            {
              expiresIn: "1d",
            }
          );

          return res.status(200).send({
            id: user._id,
            username,
            token,
            firstName: first_name,
            lastName: last_name,
          });
        }
        return res.status(401).send({
          fields: ["password"],
          msg: "Incorrect You"
        });
      });
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
