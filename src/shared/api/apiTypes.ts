export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
  timestamp: string;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: string[];
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};