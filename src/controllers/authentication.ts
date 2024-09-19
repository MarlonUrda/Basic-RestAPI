import express from "express";
import { createUser, getUsersByEmail } from "../db/users";
import { authentication, random } from "../helpers";

export const login = async (
  request: express.Request,
  response: express.Response
) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response
        .status(400)
        .json({ message: "Email or password are missing" });
    }

    const user = await getUsersByEmail(email).select(
      "+authentication.salt +authentication.password"
    );

    if (!user) {
      return response.status(400).json({ message: "User not found" });
    }

    const expectedHash = authentication(user.authentication.salt, password);

    if (user.authentication.password !== expectedHash) {
      return response.status(403).json({ message: "Password incorrect" });
    }

    const salt = random();
    user.authentication.sessionToken = authentication(
      salt,
      user._id.toString()
    );

    await user.save();

    response.cookie("MARLON-AUTH", user.authentication.sessionToken, {
      domain: "localhost",
      path: "/",
    });

    return response.status(200).json({ message: "Success!", user: user }).end();
  } catch (error) {
    console.log(error);
    return response.sendStatus(400);
  }
};

export const register = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await getUsersByEmail(email);

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = random();
    const user = await createUser({
      email,
      username,
      authentication: {
        salt,
        password: authentication(salt, password),
      },
    });

    return res.status(200).json(user).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};
