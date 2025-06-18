
export interface GroundingSourceIdentifier {
  segmentId?: string;
  partIndex?: number;
}

export interface WebSource {
  uri?: string;
  title?: string;
}

export interface RetrievedContextSource {
  uri?: string;
  title?: string;
}

export interface GroundingChunk {
  web?: WebSource;
  retrievedContext?: RetrievedContextSource;
  sourceId?: GroundingSourceIdentifier;
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingAttributions?: any[]; // Type this more specifically if structure is known
  groundingChunks?: GroundingChunk[];
}

export interface ProcessedGroundingSource {
  type: 'web' | 'retrievedContext';
  uri?: string;
  title?: string;
}

export interface GeminiAnswer {
  text: string;
  groundingSources: ProcessedGroundingSource[];
}

// Add any other shared types here
