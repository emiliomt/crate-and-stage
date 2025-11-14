export interface DiscogsVinylResult {
  id: number;
  title: string;
  year?: string;
  country?: string;
  format: string;
  label: string;
  coverImage?: string;
  uri: string;
  resourceUrl: string;
}

export interface DiscogsSearchResponse {
  results: DiscogsVinylResult[];
  totalResults: number;
}
