import express from "express";
import { get, merge } from "lodash";

import { getUserBySessionToken } from "../db/users";

export const isOwner = async (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
) => {
  try {
    const { id } = request.params;
    const currentUserId = get(request, "identity._id") as string;
    console.log(currentUserId);

    if (!currentUserId) {
      return response.sendStatus(403);
    }

    if (currentUserId.toString() !== id) {
      return response.sendStatus(403);
    }

    next();
  } catch (error) {
    console.log(error);
    return response.sendStatus(400);
  }
};

export const isAuthenticated = async (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
) => {
  try {
    const sessionToken = request.cookies["MARLON-AUTH"];

    if (!sessionToken) {
      return response.sendStatus(403);
    }

    const existingUser = await getUserBySessionToken(sessionToken);

    if (!existingUser) {
      return response.sendStatus(403);
    }

    merge(request, { identity: existingUser });

    return next();
  } catch (error) {
    console.log(error);
    return response.sendStatus(400);
  }
};
