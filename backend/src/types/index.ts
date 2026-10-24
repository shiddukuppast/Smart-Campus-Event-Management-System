export type Role = "ORGANIZER" | "PARTICIPANT";
export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";
export type RegistrationStatus = "REGISTERED" | "CANCELLED";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
