const { Schema, model } = require("mongoose");

const chatSchema = new Schema({
  user_ids: [Schema.Types.ObjectId],
  chat_name: String
});

module.exports = model("chat", chatSchema);