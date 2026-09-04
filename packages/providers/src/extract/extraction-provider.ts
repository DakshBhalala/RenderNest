export interface ExtractionRequest {
  url: string;
  html: string;
  schema: Record<string, any>;
  prompt?: string;
}

export interface ExtractionResult {
  data: Record<string, any>;
  modelUsed: string;
  schemaValid: boolean;
}

export interface IExtractionProvider {
  extract(request: ExtractionRequest): Promise<ExtractionResult>;
}
