const { Schema, model } = require("mongoose");

const profileSchema = new Schema({
  first_name: String,
  last_name: String,
  contacts: [Schema.Types.ObjectId],
  user_id: Schema.Types.ObjectId,
  is_online: Boolean,
  groups: [Schema.Types.ObjectId]
});

module.exports = model("profile", profileSchema);
