export interface Rate {
    date: string;
    rate: number;
    time: string;
    timestamp: string;
  }

export interface CBSLRate {
  date: string;
  rate: number;
  timestamp: string;
}

export interface CombinedRate {
  date: string;
  rate: number;
  cbslRate?: number;
  timestamp: string;
}
