import { CustomError } from "./custom-error";

export class badRequestError extends CustomError {
  statusCode = 400;

  constructor(public message: string) {
    super(message);
    // Only because we are extending a built in class
    Object.setPrototypeOf(this, badRequestError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
