export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
  EMPLOYEE = 'EMPLOYEE'
}

export interface BaseUser {
  id?: string;
  userName: string;
  email: string;
  role: UserRole;
}

export interface UserProfile {
  id: number;
  userName: string;
  email: string;
  role: UserRole;
  isGuest: boolean;
}