import type { Request, Response, NextFunction } from "express";
import { RegisterUser } from "@auth/application/use-cases/register-user.js";
import { AuthenticateUser } from "@auth/application/use-cases/authenticate-user.js";
import { RotateApiKey } from "@auth/application/use-cases/rotate-api-key.js";
import { toAuthResponseDto } from "@auth/application/dto/auth-response-dto.js";

export class AuthController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly authenticateUser: AuthenticateUser,
    private readonly rotateApiKey: RotateApiKey,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, name, password } = req.body as {
        email: string;
        name: string;
        password: string;
      };
      const result = await this.registerUser.execute({ email, name, password });
      req.session.userId = result.id;
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await this.authenticateUser.execute({ email, password });
      if (!result) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      req.session.userId = result.id;
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    res.json(
      toAuthResponseDto({
        id: req.user!.id,
        email: req.user!.email,
        name: req.user!.name,
        apiKey: req.user!.apiKey,
      }),
    );
  };

  rotateApiKeyHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.rotateApiKey.execute(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
