export interface ImportCSVResponse {
  total_processed: number;
  success_count: number;
  error_count: number;
  errors: {
    row: number;
    reason: string;
  }[];
}