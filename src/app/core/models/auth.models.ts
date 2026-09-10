export interface LoginRequest {
  email: string;
  password: string;
}

export interface AppUser {
  id: number;
  fullName: string;
  email: string;
  role: 'Admin' | 'User';
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AppUser;
}

export interface UserRequest {
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  password?: string | null;
}
