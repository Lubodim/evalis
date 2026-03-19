import { Injectable } from "@nestjs/common";

@Injectable()
export class ClassesService {
  findAll() {
    return {
      items: [],
      message: "Class listing is not implemented yet."
    };
  }

  findOne(id: string) {
    return {
      id,
      message: "Class lookup is not implemented yet."
    };
  }
}
