export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          whatsapp_number: string | null;
          email: string | null;
          role: "publicador" | "moderador" | "administrador" | "superadmin";
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          whatsapp_number?: string | null;
          email?: string | null;
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
          intencion: "ofrezco" | "busco";
          tipo: "producto" | "servicio" | "experiencia" | "inmueble" | "usado_herramienta" | "otro" | null;
          rol: "negocio" | "vecino" | null;
          categoria: string | null;
          subcategoria: string | null;
          zona: string;
          cuadrante: string | null;
          direccion: string | null;
          nombre: string;
          descripcion: string;
          foto_url: string | null;
          modalidad: string[];
          tags: string[];
          cantidad: number | null;
          precio: number | null;
          precio_a_consultar: boolean;
          sello: boolean;
          destacada: boolean;
          detalles: Record<string, unknown>;
          expires_at: string | null;
          status: "activa" | "pausada" | "vencida" | "eliminada";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          publisher_id: string;
          intencion: "ofrezco" | "busco";
          tipo?: "producto" | "servicio" | "experiencia" | "inmueble" | "usado_herramienta" | "otro" | null;
          categoria?: string | null;
          subcategoria?: string | null;
          zona: string;
          cuadrante?: string | null;
          direccion?: string | null;
          nombre: string;
          descripcion: string;
          foto_url?: string | null;
          modalidad?: string[];
          tags?: string[];
          cantidad?: number | null;
          precio?: number | null;
          precio_a_consultar?: boolean;
          detalles?: Record<string, unknown>;
          status?: "activa";
        };
        Update: {
          status?: string;
        };
        Relationships: [];
      };
      anuncios: {
        Row: {
          id: string;
          tipo: "evento" | "aviso_barrial" | "sponsor" | "promocion" | "comunicado" | "feria" | "novedad";
          titulo: string;
          descripcion: string;
          imagen_url: string | null;
          fecha_evento: string | null;
          lugar: string | null;
          solicitante_id: string | null;
          status: "solicitado" | "en_conversacion" | "aprobado" | "programado" | "publicado" | "pausado" | "vencido" | "rechazado";
          orden: number;
          notas_internas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          tipo: "evento" | "aviso_barrial" | "sponsor" | "promocion" | "comunicado" | "feria" | "novedad";
          titulo: string;
          descripcion: string;
          imagen_url?: string | null;
          fecha_evento?: string | null;
          lugar?: string | null;
          solicitante_id?: string | null;
          status?: "solicitado";
        };
        Update: {
          status?: string;
        };
        Relationships: [];
      };
      moderacion_log: {
        Row: {
          id: string;
          entity_type: "listing" | "anuncio";
          entity_id: string;
          actor_id: string | null;
          accion: string;
          detalle: string | null;
          created_at: string;
        };
        Insert: {
          entity_type: "listing" | "anuncio";
          entity_id: string;
          actor_id?: string | null;
          accion: string;
          detalle?: string | null;
        };
        Update: {
          detalle?: string | null;
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
      admin_set_role: {
        Args: { p_user_id: string; p_role: string };
        Returns: undefined;
      };
      admin_set_listing_status: {
        Args: { p_listing_id: string; p_status: string; p_nota?: string | null };
        Returns: undefined;
      };
      admin_set_sello: {
        Args: { p_listing_id: string; p_value: boolean };
        Returns: undefined;
      };
      admin_set_destacada: {
        Args: { p_listing_id: string; p_value: boolean };
        Returns: undefined;
      };
      admin_add_nota: {
        Args: { p_entity_type: string; p_entity_id: string; p_nota: string };
        Returns: undefined;
      };
      admin_update_listing: {
        Args: {
          p_listing_id: string;
          p_nombre?: string | null;
          p_descripcion?: string | null;
          p_categoria?: string | null;
          p_subcategoria?: string | null;
          p_precio?: number | null;
          p_precio_a_consultar?: boolean | null;
          p_foto_url?: string | null;
          p_modalidad?: string[] | null;
          p_tags?: string[] | null;
          p_cantidad?: number | null;
          p_detalles?: Record<string, unknown> | null;
          p_zona?: string | null;
          p_cuadrante?: string | null;
          p_direccion?: string | null;
          p_nota?: string | null;
        };
        Returns: undefined;
      };
      solicitar_anuncio: {
        Args: {
          p_tipo: string;
          p_titulo: string;
          p_descripcion: string;
          p_imagen_url?: string | null;
          p_fecha_evento?: string | null;
          p_lugar?: string | null;
        };
        Returns: string;
      };
      admin_process_anuncio: {
        Args: {
          p_anuncio_id: string;
          p_status?: string | null;
          p_titulo?: string | null;
          p_descripcion?: string | null;
          p_imagen_url?: string | null;
          p_fecha_evento?: string | null;
          p_lugar?: string | null;
          p_orden?: number | null;
          p_nota?: string | null;
        };
        Returns: undefined;
      };
    };
  };
}

export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type AnuncioRow = Database["public"]["Tables"]["anuncios"]["Row"];
export type ModeracionLogRow = Database["public"]["Tables"]["moderacion_log"]["Row"];
