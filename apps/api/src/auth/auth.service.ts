import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {
  getModuleHealth() {
    return {
      module: "auth",
      status: "ok"
    };
  }

  login(body: { email?: string; password?: string }) {
    return {
      message: "Login is not implemented yet.",
      email: body.email ?? null,
      authenticated: false
    };
  }
}
