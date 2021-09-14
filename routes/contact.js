const router = require("express").Router();

const auth = require("../middleware/auth");
const Profile = require("../models/Profile");
const User = require("../models/User");

router.get("/", auth, (req, res) => {
  res.status(200).send("It works 👌");
});

router.get("/add", auth, (req, res) => {
  try {
    let { username } = req.body;
    User.find({ username }, (err, user) => {
      if (err) return console.log(err);

      if (user) {
        Profile.updateOne(
          { user_id: req.user },
          { $addToSet: { contacts: [result._id] } },
          (err, _) => {
            if (err) return console.log(err);

            return res
              .status(200)
              .send({ msg: "New contact was successfully added" });
          }
        );
      }
      return res
        .status(400)
        .send({ msg: "User does not exists or was not found " });
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
