import { FileUpload } from "./upload.types";

export interface SignupInputType {
  fullName: string;
  email: string;
  username: string;
  password: string;
  avatar: Promise<FileUpload>;
}

export interface SigninInputType {
  identifier: string;
  password: string;
}
