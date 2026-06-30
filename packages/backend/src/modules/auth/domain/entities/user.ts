import { BaseEntity } from "@shared/domain/base-entity.js";
import { Email } from "@auth/domain/value-objects/email.js";
import { Password } from "@auth/domain/value-objects/password.js";
import { ApiKey } from "@auth/domain/value-objects/api-key.js";

export class User extends BaseEntity {
  readonly email: Email;
  readonly name: string;
  readonly passwordHash: string;
  readonly apiKey: string | null;

  constructor(params: {
    id: string;
    email: Email;
    name: string;
    passwordHash: string;
    apiKey?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id, params.createdAt, params.updatedAt);
    this.email = params.email;
    this.name = params.name;
    this.passwordHash = params.passwordHash;
    this.apiKey = params.apiKey ?? null;
  }

  static create(params: {
    id: string;
    email: Email;
    name: string;
    password: Password;
  }): User {
    const now = new Date();
    return new User({
      id: params.id,
      email: params.email,
      name: params.name,
      passwordHash: params.password.hash,
      apiKey: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  withApiKey(key: ApiKey): User {
    return new User({
      id: this.id,
      email: this.email,
      name: this.name,
      passwordHash: this.passwordHash,
      apiKey: key.value,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
