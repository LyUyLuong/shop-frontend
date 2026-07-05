export type AuthResponse = {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  accessToken: string;
  tokenType: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  name: string;
  password: string;
};