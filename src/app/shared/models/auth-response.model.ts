import { UserRole } from "../user-roles.model";

export interface AuthResponse {
    token: string;
    userName: string;
    email: string;
    role: UserRole;
    refreshToken?: string;
    isGuest?: boolean;  
  }