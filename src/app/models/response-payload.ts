import { User } from "./user";

export class ResponsePayload {
  id_team(id_team: any) {
    throw new Error('Method not implemented.');
  }
  status!: boolean;
  payload!: any
  user_pass: Array<User>;
  user_not_pass: Array<User>;;
}
