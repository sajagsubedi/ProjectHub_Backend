import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import UserModel from "../models/user.model";

interface CustomJwtPayload extends JwtPayload {
  _id: string;
  email: string;
  username: string;
  fullName: string;
}

export const verifyAuth = async (req: Request) => {
  const token = req.cookies?.accessToken;
  console.log("--------------------------------")
  console.log("token is ", token, " from ", new Date().toLocaleString());
  console.log(req.body);
  console.log("------------------------------\n\n")
  
  if (!token) {
    return null;
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || "projecthub123"
    ) as CustomJwtPayload;
    const existingUser = await UserModel.findById(decoded?._id).select(
      "-password -refreshToken"
    );
    if (!existingUser) {
      return null;
    }
    return existingUser;
  } catch (error) {
    console.log("error is ", error);
    return null;
  }
};
