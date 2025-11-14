export interface BandsintownArtist {
  id: string;
  name: string;
  url: string;
  image_url: string;
  thumb_url: string;
  facebook_page_url: string;
  mbid: string;
  tracker_count: number;
  upcoming_event_count: number;
  support_url: string;
}

export interface BandsintownVenue {
  name: string;
  latitude: string;
  longitude: string;
  city: string;
  region: string;
  country: string;
}

export interface BandsintownOffer {
  type: string;
  url: string;
  status: string;
}

export interface BandsintownEvent {
  id: string;
  url: string;
  on_sale_datetime: string;
  datetime: string;
  description: string;
  venue: BandsintownVenue;
  offers: BandsintownOffer[];
  lineup: string[];
  artist_id: string;
}

export type DateFilter = 'all' | 'week' | 'month' | 'three_months' | 'custom';
