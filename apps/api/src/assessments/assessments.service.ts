import { Injectable } from "@nestjs/common";

@Injectable()
export class AssessmentsService {
  findAll() {
    return {
      items: [],
      message: "Assessment listing is not implemented yet."
    };
  }

  findOne(id: string) {
    return {
      id,
      message: "Assessment lookup is not implemented yet."
    };
  }
}
