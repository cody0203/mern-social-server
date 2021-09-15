import mongoose from "mongoose";

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  likes: [
    {
      type: Schema.ObjectId,
      ref: "User",
    },
  ],
  replies: [{ type: Schema.ObjectId, ref: "Comment", required: true }],
  owner: {
    type: Schema.ObjectId,
    ref: "User",
    required: true,
  },
  postId: { type: Schema.ObjectId, ref: "Post", required: true },
  commentId: { type: Schema.ObjectId, ref: "Post" },
  created: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Comment", commentSchema);
