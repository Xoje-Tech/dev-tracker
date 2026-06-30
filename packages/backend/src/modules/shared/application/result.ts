export type Success<T> = {
  success: true;
  value: T;
};

export type Failure = {
  success: false;
  error: string;
  statusCode: number;
};

export type Result<T> = Success<T> | Failure;

export function ok<T>(value: T): Success<T> {
  return { success: true, value };
}

export function fail(message: string, statusCode = 400): Failure {
  return { success: false, error: message, statusCode };
}
