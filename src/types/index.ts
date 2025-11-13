export interface Memory {
  id: number;
  memory: string;
  created_at: string;
  memory_id: string;
}

export interface Theme {
  name: string;
  backgroundColor: string;
  textColor: string;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface PresenceState {
  online_at: string;
}
