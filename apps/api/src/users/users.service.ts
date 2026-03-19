import { Injectable } from "@nestjs/common";

@Injectable()
export class UsersService {
  findAll() {
    return {
      items: [],
      message: "User listing is not implemented yet."
    };
  }

  findOne(id: string) {
    return {
      id,
      message: "User lookup is not implemented yet."
    };
  }
}
