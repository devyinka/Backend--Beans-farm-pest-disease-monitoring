export interface sendmail {
  to: string;
  subject: string;
  text: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  created_at: Date;
}

export interface signup {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  password: string;
}

export interface login {
  email: string;
  password: string;
}
