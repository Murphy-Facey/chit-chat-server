const { Schema, model } = require("mongoose");

const messageSchema = new Schema({
  message: String,
  date_sent: Date,
  chat_id: Schema.Types.ObjectId,
  user_id: Schema.Types.ObjectId,
});

module.exports = model("message", messageSchema);