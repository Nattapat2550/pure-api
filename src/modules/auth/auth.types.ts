export interface RegisterPayload {
  email: string;
}

export interface VerifyCodePayload {
  email: string;
  code: string;
}

export interface CompleteProfilePayload {
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}
