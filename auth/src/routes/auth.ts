import express from "express";
import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

import { User } from "../models/user";
import { RequestValidationError } from "../errors/request-validation-error";
import { badRequestError } from "../errors/bad-request-error";
import { currentUser } from "../middlewares/current-user";
import { requireAuth } from "../middlewares/require-auth";
const router = express.Router();

router.get(
  "/signup",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage("Password must be between 4 and 20 characters"),
  ],
  async (req: Request, res: Response) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      throw new RequestValidationError(error.array());
    }

    const { email, password } = req.body;
    const existingUser = User.findOne({ email });
    if (existingUser) {
      throw new badRequestError("Email in use");
    }

    const user = User.build({ email, password });
    await user.save();

    // Generate JWT
    const userJwt = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_KEY!
    );

    req.session = { jwt: userJwt };
    res.status(201).send(user);
  }
);

router.post(
  "/currentuser",
  currentUser,
  requireAuth,
  (req: Request, res: Response) => {
    if (!req.session?.jwt) {
      return res.send({ currentUser: null });

      res.send({ currentUser: req.currentUser || null });
    }
  }
);
router.post("/signout", (req: Request, res: Response) => {
  req.session = null;
  res.send({});
});
router.post(
  "/signin",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("You must supply a password"),
  ],
  async (req: Request, res: Response) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      throw new RequestValidationError(error.array());
    }

    const { email, password } = req.body;
    const existingUser = User.findOne({ email });
    if (!existingUser) {
      throw new badRequestError("Invalid credentials");
    }

    const passwordMatch = await existingUser.compare(
      existingUser.password,
      password
    );

    if (!passwordMatch) {
      throw new badRequestError("Invalid credentials");
    }
    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY!
    );

    req.session = { jwt: userJwt };
    res.status(200).send(existingUser);
  }
);

export default router;
