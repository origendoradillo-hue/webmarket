export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          whatsapp_number: string | null;
          email: string | null;
          role: "publicador" | "admin" | "superadmin";
          email_verified_at: string | null;
          whatsapp_verified_at: string | null;
          verification_level: 1 | 2 | 3;
          blocked_at: string | null;
          must_change_password: boolean;
          zona: string | null;
          rating_promedio: number | null;
          resenas_count: number;
          nickname: string | null;
          instagram_url: string | null;
          facebook_url: string | null;
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
          must_change_password?: boolean;
          zona?: string | null;
          nickname?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
        };
        Relationships: [];
      };
      user_verifications: {
        Row: {
          id: string;
          user_id: string;
          nivel_solicitado: 2 | 3;
          motivo: string;
          evidencia_url: string | null;
          estado: "pendiente" | "aprobada" | "rechazada";
          revisado_por: string | null;
          revisado_en: string | null;
          nota_revision: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          nivel_solicitado: 2 | 3;
          motivo: string;
          evidencia_url?: string | null;
        };
        Update: {
          estado?: "pendiente" | "aprobada" | "rechazada";
          revisado_por?: string | null;
          revisado_en?: string | null;
          nota_revision?: string | null;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          publisher_id: string;
          intencion: "ofrezco" | "busco";
          tipo: "producto" | "servicio" | "experiencia" | "inmueble" | "usado" | "emprendimiento" | "otro" | null;
          rol: "negocio" | "vecino" | null;
          categoria: string | null;
          subcategoria: string | null;
          zona: string;
          cuadrante: string | null;
          direccion: string | null;
          nombre: string;
          subtitulo: string | null;
          descripcion: string;
          foto_url: string | null;
          modalidad: string[];
          tags: string[];
          etiquetas: string[];
          cantidad: number | null;
          precio: number | null;
          precio_a_consultar: boolean;
          precio_regalo: boolean;
          whatsapp_publico: boolean;
          short_code: string;
          sello: boolean;
          destacada: boolean;
          emprendimiento_destacado: boolean;
          detalles: Record<string, unknown>;
          expires_at: string | null;
          views_count: number;
          status: "borrador" | "en_revision" | "activa" | "observada" | "rechazada" | "pausada" | "vencida" | "eliminada";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          publisher_id: string;
          intencion: "ofrezco" | "busco";
          tipo?: "producto" | "servicio" | "experiencia" | "inmueble" | "usado" | "emprendimiento" | "otro" | null;
          categoria?: string | null;
          subcategoria?: string | null;
          zona: string;
          cuadrante?: string | null;
          direccion?: string | null;
          nombre: string;
          subtitulo?: string | null;
          descripcion: string;
          foto_url?: string | null;
          modalidad?: string[];
          tags?: string[];
          etiquetas?: string[];
          cantidad?: number | null;
          precio?: number | null;
          precio_a_consultar?: boolean;
          precio_regalo?: boolean;
          whatsapp_publico?: boolean;
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
          ubicacion: "home" | "categoria" | "ambas";
          layout_type: "flyer_on_sign" | "full_banner" | "text_only" | "background_image";
          image_orientation: "vertical" | "horizontal" | "square" | null;
          background_image_url: string | null;
          cta_label: string | null;
          cta_url: string | null;
          short_code: string;
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
          entity_type: "listing" | "anuncio" | "denuncia";
          entity_id: string;
          actor_id: string | null;
          accion: string;
          detalle: string | null;
          created_at: string;
        };
        Insert: {
          entity_type: "listing" | "anuncio" | "denuncia";
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
          clicked_by: string | null;
          tipo_contacto: "publico" | "con_login";
          created_at: string;
        };
        Insert: {
          listing_id: string;
          clicked_by?: string | null;
          tipo_contacto?: "publico" | "con_login";
        };
        Update: {
          listing_id?: string;
        };
        Relationships: [];
      };
      favoritos: {
        Row: {
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          listing_id: string;
        };
        Update: never;
        Relationships: [];
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          url: string;
          orden: number;
          created_at: string;
        };
        Insert: {
          listing_id: string;
          url: string;
          orden?: number;
        };
        Update: {
          orden?: number;
        };
        Relationships: [];
      };
      categories: {
        Row: { id: string; label: string; icon: string; orden: number; tipo_scope: string[]; created_at: string };
        Insert: { id: string; label: string; icon: string; orden?: number; tipo_scope?: string[] };
        Update: { id?: string; label?: string; icon?: string; orden?: number; tipo_scope?: string[] };
        Relationships: [];
      };
      subcategories: {
        Row: { id: string; category_id: string; label: string; orden: number };
        Insert: { category_id: string; label: string; orden?: number };
        Update: { label?: string; orden?: number };
        Relationships: [];
      };
      zones: {
        Row: { id: string; label: string; orden: number };
        Insert: { label: string; orden?: number };
        Update: { label?: string; orden?: number };
        Relationships: [];
      };
      site_visits: {
        Row: { id: string; created_at: string };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      renewal_requests: {
        Row: {
          id: string;
          listing_id: string;
          renewed_by: string | null;
          previous_expires_at: string | null;
          new_expires_at: string;
          created_at: string;
        };
        Insert: {
          listing_id: string;
          renewed_by?: string | null;
          previous_expires_at?: string | null;
          new_expires_at: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      listing_reports: {
        Row: {
          id: string;
          listing_id: string;
          reporter_id: string;
          motivo:
            | "informacion_falsa"
            | "producto_no_disponible"
            | "precio_no_coincide"
            | "publicador_no_responde"
            | "sospecha_estafa"
            | "contenido_inapropiado"
            | "categoria_incorrecta"
            | "publicacion_duplicada"
            | "fotos_falsas"
            | "insultos_agravios"
            | "otro";
          justificacion: string;
          evidencia_url: string | null;
          respuesta_denunciado: string | null;
          estado: "pendiente" | "en_revision" | "resuelta" | "rechazada";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          listing_id: string;
          reporter_id: string;
          motivo:
            | "informacion_falsa"
            | "producto_no_disponible"
            | "precio_no_coincide"
            | "publicador_no_responde"
            | "sospecha_estafa"
            | "contenido_inapropiado"
            | "categoria_incorrecta"
            | "publicacion_duplicada"
            | "fotos_falsas"
            | "insultos_agravios"
            | "otro";
          justificacion: string;
          evidencia_url?: string | null;
        };
        Update: {
          estado?: "pendiente" | "en_revision" | "resuelta" | "rechazada";
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          reviewer_id: string;
          target_user_id: string;
          listing_id: string | null;
          rating: 1 | 2 | 3 | 4 | 5;
          comentario: string | null;
          estado: "publicada" | "oculta";
          created_at: string;
        };
        Insert: {
          reviewer_id: string;
          target_user_id: string;
          listing_id?: string | null;
          rating: 1 | 2 | 3 | 4 | 5;
          comentario?: string | null;
        };
        Update: {
          estado?: "publicada" | "oculta";
        };
        Relationships: [];
      };
      review_reports: {
        Row: {
          id: string;
          review_id: string;
          reporter_id: string | null;
          motivo: "informacion_falsa" | "contenido_inapropiado" | "sospecha_falsa" | "otro";
          justificacion: string;
          estado: "pendiente" | "resuelta" | "rechazada";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          review_id: string;
          reporter_id: string;
          motivo: "informacion_falsa" | "contenido_inapropiado" | "sospecha_falsa" | "otro";
          justificacion: string;
        };
        Update: {
          estado?: "pendiente" | "resuelta" | "rechazada";
        };
        Relationships: [];
      };
      support_requests: {
        Row: {
          id: string;
          user_id: string | null;
          nombre: string;
          contacto: string;
          mensaje: string;
          estado: "pendiente" | "resuelta";
          created_at: string;
          resuelto_por: string | null;
          resuelto_en: string | null;
        };
        Insert: never;
        Update: {
          estado?: "pendiente" | "resuelta";
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
      admin_set_blocked: {
        Args: { p_user_id: string; p_blocked: boolean };
        Returns: undefined;
      };
      admin_reassign_listing: {
        Args: { p_listing_id: string; p_new_publisher_id: string };
        Returns: undefined;
      };
      admin_convertir_listing_en_anuncio: {
        Args: { p_listing_id: string; p_tipo?: string; p_cta_url?: string | null; p_cta_label?: string | null };
        Returns: string;
      };
      admin_update_profile: {
        Args: { p_user_id: string; p_full_name?: string | null; p_whatsapp_number?: string | null };
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
      admin_set_emprendimiento_destacado: {
        Args: { p_listing_id: string; p_value: boolean };
        Returns: undefined;
      };
      admin_add_nota: {
        Args: { p_entity_type: string; p_entity_id: string; p_nota: string };
        Returns: undefined;
      };
      admin_set_report_status: {
        Args: { p_report_id: string; p_estado: string; p_nota?: string | null };
        Returns: undefined;
      };
      responder_denuncia: {
        Args: { p_report_id: string; p_respuesta: string };
        Returns: undefined;
      };
      renovar_publicacion: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      expire_old_listings: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      registrar_vista: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      registrar_visita_sitio: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      admin_delete_listing: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      admin_delete_anuncio: {
        Args: { p_anuncio_id: string };
        Returns: undefined;
      };
      admin_set_verification_status: {
        Args: { p_request_id: string; p_estado: string; p_nota?: string | null };
        Returns: undefined;
      };
      submit_review: {
        Args: { p_listing_id: string; p_rating: number; p_comentario?: string | null };
        Returns: undefined;
      };
      admin_set_review_report_status: {
        Args: { p_report_id: string; p_estado: string };
        Returns: undefined;
      };
      mi_set_listing_status: {
        Args: { p_listing_id: string; p_status: string };
        Returns: undefined;
      };
      crear_borrador: {
        Args: {
          p_intencion: string;
          p_tipo?: string | null;
          p_categoria?: string | null;
          p_subcategoria?: string | null;
          p_zona?: string | null;
          p_cuadrante?: string | null;
          p_direccion?: string | null;
          p_nombre?: string | null;
          p_subtitulo?: string | null;
          p_descripcion?: string | null;
          p_foto_url?: string | null;
          p_modalidad?: string[] | null;
          p_tags?: string[] | null;
          p_etiquetas?: string[] | null;
          p_precio?: number | null;
          p_precio_a_consultar?: boolean | null;
          p_precio_regalo?: boolean | null;
          p_whatsapp_publico?: boolean | null;
        };
        Returns: string;
      };
      mi_update_listing: {
        Args: {
          p_listing_id: string;
          p_nombre?: string | null;
          p_subtitulo?: string | null;
          p_descripcion?: string | null;
          p_categoria?: string | null;
          p_subcategoria?: string | null;
          p_precio?: number | null;
          p_precio_a_consultar?: boolean | null;
          p_precio_regalo?: boolean | null;
          p_foto_url?: string | null;
          p_modalidad?: string[] | null;
          p_tags?: string[] | null;
          p_cantidad?: number | null;
          p_detalles?: Record<string, unknown> | null;
          p_zona?: string | null;
          p_cuadrante?: string | null;
          p_direccion?: string | null;
          p_whatsapp_publico?: boolean | null;
        };
        Returns: undefined;
      };
      admin_update_listing: {
        Args: {
          p_listing_id: string;
          p_nombre?: string | null;
          p_subtitulo?: string | null;
          p_descripcion?: string | null;
          p_categoria?: string | null;
          p_subcategoria?: string | null;
          p_precio?: number | null;
          p_precio_a_consultar?: boolean | null;
          p_precio_regalo?: boolean | null;
          p_foto_url?: string | null;
          p_modalidad?: string[] | null;
          p_tags?: string[] | null;
          p_cantidad?: number | null;
          p_detalles?: Record<string, unknown> | null;
          p_zona?: string | null;
          p_cuadrante?: string | null;
          p_direccion?: string | null;
          p_nota?: string | null;
          p_whatsapp_publico?: boolean | null;
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
          p_ubicacion?: string | null;
          p_layout_type?: string | null;
          p_image_orientation?: string | null;
          p_background_image_url?: string | null;
          p_cta_label?: string | null;
          p_cta_url?: string | null;
        };
        Returns: undefined;
      };
      crear_solicitud_soporte: {
        Args: { p_nombre: string; p_contacto: string; p_mensaje: string };
        Returns: undefined;
      };
      admin_set_support_request_status: {
        Args: { p_request_id: string; p_estado: string };
        Returns: undefined;
      };
    };
  };
}

export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type AnuncioRow = Database["public"]["Tables"]["anuncios"]["Row"];
export type ModeracionLogRow = Database["public"]["Tables"]["moderacion_log"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type SubcategoryRow = Database["public"]["Tables"]["subcategories"]["Row"];
export type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
export type ListingReportRow = Database["public"]["Tables"]["listing_reports"]["Row"];
export type UserVerificationRow = Database["public"]["Tables"]["user_verifications"]["Row"];
export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewReportRow = Database["public"]["Tables"]["review_reports"]["Row"];
export type RenewalRequestRow = Database["public"]["Tables"]["renewal_requests"]["Row"];
export type SupportRequestRow = Database["public"]["Tables"]["support_requests"]["Row"];
export type FavoritoRow = Database["public"]["Tables"]["favoritos"]["Row"];
