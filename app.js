
const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());

// routes
const userRoute = require("./routes/user");
const contactRoute = require("./routes/contact");

app.use("/user", userRoute);
app.use("/contact", contactRoute);

app.get("/", (req, res) => {
  res.send("<h1>Hello World</h1>");
});

module.exports = app;