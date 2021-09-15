import mongoose from "mongoose";

const Schema = mongoose.Schema;

const postSchema = new Schema({
  content: {
    type: String,
    trim: true,
    required: true,
  },
  public: {
    type: Boolean,
    default: true,
  },
  photo: {
    data: Buffer,
    contentType: String,
  },

  likes: [{ type: Schema.ObjectId, ref: "User" }],
  comments: [
    {
      type: Schema.ObjectId,
      ref: "Comment",
    },
  ],
  owner: {
    type: Schema.ObjectId,
    ref: "User",
    required: true,
  },

  created: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Post", postSchema);
