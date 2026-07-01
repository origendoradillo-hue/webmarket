export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          whatsapp_number: string | null;
          role: "publicador" | "moderador" | "administrador" | "superadmin";
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          whatsapp_number?: string | null;
        };
        Update: {
          full_name?: string | null;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          publisher_id: string;
          tipo_aviso: "oferta" | "demanda" | "evento";
          rol: "negocio" | "vecino" | null;
          categoria: string;
          subcategoria: string;
          zona: string;
          cuadrante: string | null;
          direccion: string | null;
          nombre: string;
          descripcion: string;
          foto_url: string | null;
          modalidad: string[];
          tags: string[];
          cantidad: number | null;
          status:
            | "borrador"
            | "en_revision"
            | "publicada"
            | "observada"
            | "rechazada"
            | "pausada"
            | "vencida"
            | "eliminada";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          publisher_id: string;
          tipo_aviso: "oferta" | "demanda" | "evento";
          rol?: "negocio" | "vecino" | null;
          categoria: string;
          subcategoria: string;
          zona: string;
          cuadrante?: string | null;
          direccion?: string | null;
          nombre: string;
          descripcion: string;
          foto_url?: string | null;
          modalidad?: string[];
          tags?: string[];
          cantidad?: number | null;
          status?: "en_revision";
        };
        Update: {
          status?: string;
        };
        Relationships: [];
      };
      whatsapp_clicks: {
        Row: {
          id: string;
          listing_id: string;
          clicked_by: string;
          created_at: string;
        };
        Insert: {
          listing_id: string;
          clicked_by: string;
        };
        Update: {
          listing_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      contactar_publicacion: {
        Args: { p_listing_id: string };
        Returns: string;
      };
    };
  };
}

export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
