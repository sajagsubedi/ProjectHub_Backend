export interface SignupInputType {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confpassword: string;
}

export interface SigninInputType {
  identifier: string;
  password: string;
}
