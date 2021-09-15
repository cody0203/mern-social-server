import express from "express";

import authControllers from "../controllers/auth.controllers";

const router = express.Router();

router.post("/auth/sign-in", authControllers.signIn);

router.get("/auth/sign-out", authControllers.signOut);

router.get(
  "/auth/user-info",
  authControllers.requireSignIn,
  authControllers.userInfo
);

export default router;
