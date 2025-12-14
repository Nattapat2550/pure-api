export type RegisterBody = {
  username?: string;
  email: string;
  password: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    username: string | null;
    role: "user" | "admin";
    profile_picture_url: string | null;
    is_email_verified: boolean;
  };
};

export type OAuthGoogleBody = {
  email: string;
  oauthId: string;
  username?: string;
  pictureUrl?: string | null;
};
