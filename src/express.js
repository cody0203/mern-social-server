import path from "path";

import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compress from "compression";
import cors from "cors";
import jwt from "jsonwebtoken";

import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import postRoutes from "./routes/post.routes";
import commentRoutes from "./routes/comment.routes";

const CURRENT_WORKING_DIR = process.cwd();

const app = express();

app.use("/dist", express.static(path.join(CURRENT_WORKING_DIR, "dist")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(compress());
app.use(cors());

app.use("/", userRoutes);
app.use("/", authRoutes);
app.use("/", postRoutes);
app.use("/", commentRoutes);

app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    res.status(401).json({ error: `${err.name}: ${err.message}` });
  } else if (err) {
    res.status(400).json({ error: `${err.name}: ${err.message}` });
    console.log(err);
  }
});

export default app;
