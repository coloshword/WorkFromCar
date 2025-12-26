export type AuthAccount = {
  accountId: number;
  email: string;
}

export type GoogleAuthPayload = {
  sub: string;
  email: string;
}

export type jwtResponse = {
  jwt: string;
}