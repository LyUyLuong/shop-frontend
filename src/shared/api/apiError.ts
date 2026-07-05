import { toUserSafeMessage } from "./apiErrorMessages";

export type ApiErrorInput = {
  status: number;
  code?: string;
  backendMessage?: string;
  requestId?: string;
  details?: string[];
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly backendMessage: string | undefined;
  readonly userMessage: string;
  readonly requestId: string | undefined;
  readonly details: string[] | undefined;

  constructor(input: ApiErrorInput) {
    const userMessage = toUserSafeMessage(input.code);

    super(userMessage);

    this.name = "ApiError";
    this.status = input.status;
    this.code = input.code;
    this.backendMessage = input.backendMessage;
    this.userMessage = userMessage;
    this.requestId = input.requestId;
    this.details = input.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}