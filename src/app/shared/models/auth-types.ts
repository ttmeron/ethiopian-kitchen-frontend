import { UserRole } from "../user-roles.model";

   export interface BaseUser {
    id?: string;
    userName: string;
    email?: string;
    role: UserRole;
  }
  
  export interface RegularUser extends BaseUser {
    userName: string;
    isGuest: false;
    profileCompleted: boolean;
    preferences?: any;
  }
  
  export interface GuestUser extends BaseUser {
    id: string;
    userName: string;
    email: string;
    token: string;
    isGuest: true;
    expiresAt: Date;
    temporary?: boolean;
    role: UserRole; 
  }
  
  export type AuthUser = RegularUser | GuestUser | null;