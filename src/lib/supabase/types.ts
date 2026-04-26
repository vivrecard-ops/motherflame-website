export type LicenseStatus = "active" | "cancelled" | "past_due" | "expired";

export interface License {
  id: string;
  license_key: string;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: LicenseStatus;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      licenses: {
        Row: License;
        Insert: Omit<License, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<License, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
