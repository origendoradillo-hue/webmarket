"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  pregunta: string;
  respuesta: string | null;
  created_at: string;
}

interface ListingQuestionsProps {
  listingId: string;
  isLoggedIn: boolean;
  isOwner: boolean;
}

export default function ListingQuestions({ listingId, isLoggedIn, isOwner }: ListingQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevaPregunta, setNuevaPregunta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [respuestaDraft, setRespuestaDraft] = useState<Record<string, string>>({});
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function loadQuestions() {
    const supabase = createClient();
    const { data } = await supabase
      .from("listing_questions")
      .select("id, pregunta, respuesta, created_at")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });
    setQuestions(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  async function preguntar() {
    if (!nuevaPregunta.trim()) return;
    setEnviando(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setEnviando(false);
      return;
    }
    const { error } = await supabase
      .from("listing_questions")
      .insert({ listing_id: listingId, asker_id: user.id, pregunta: nuevaPregunta.trim() });
    setEnviando(false);
    if (error) {
      alert(error.message);
      return;
    }
    setNuevaPregunta("");
    await loadQuestions();
  }

  async function responder(questionId: string) {
    const respuesta = (respuestaDraft[questionId] || "").trim();
    if (!respuesta) return;
    setRespondingId(questionId);
    const supabase = createClient();
    const { error } = await supabase.rpc("responder_pregunta", { p_question_id: questionId, p_respuesta: respuesta });
    setRespondingId(null);
    if (error) {
      alert(error.message);
      return;
    }
    setRespuestaDraft((prev) => ({ ...prev, [questionId]: "" }));
    await loadQuestions();
  }

  if (loading) return null;

  return (
    <div className="mt-4 border-t border-piedra/40 pt-4">
      <p className="mb-2.5 font-slab text-[13px] font-semibold text-tinta">Preguntas</p>

      {questions.length === 0 && <p className="mb-3 text-[12.5px] text-tinta-suave">Todavía no hay preguntas.</p>}

      <div className="mb-3 flex flex-col gap-2.5">
        {questions.map((q) => (
          <div key={q.id} className="rounded-lg bg-hueso-2 p-3">
            <p className="mb-1 text-[12.5px] font-medium text-tinta">
              <i className="ti ti-help-circle mr-1 text-piedra" aria-hidden />
              {q.pregunta}
            </p>
            {q.respuesta ? (
              <p className="text-[12.5px] text-tinta-suave">
                <span className="font-medium text-tinta">Respuesta:</span> {q.respuesta}
              </p>
            ) : isOwner ? (
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={respuestaDraft[q.id] || ""}
                  onChange={(e) => setRespuestaDraft((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Tu respuesta"
                  className="w-full rounded-lg border border-piedra/70 bg-white px-2.5 py-1.5 text-[12.5px] text-tinta"
                />
                <button
                  onClick={() => responder(q.id)}
                  disabled={respondingId === q.id}
                  className="flex-shrink-0 rounded-lg bg-oliva px-3 py-1.5 text-[12px] font-semibold text-hueso disabled:opacity-60"
                >
                  Responder
                </button>
              </div>
            ) : (
              <p className="text-[12px] italic text-tinta-suave">Todavía sin responder</p>
            )}
          </div>
        ))}
      </div>

      {isLoggedIn && !isOwner && (
        <div className="flex gap-2">
          <input
            type="text"
            value={nuevaPregunta}
            onChange={(e) => setNuevaPregunta(e.target.value)}
            placeholder="Escribí tu pregunta"
            className="w-full rounded-lg border border-piedra/70 px-2.5 py-2 text-[13px] text-tinta"
          />
          <button
            onClick={preguntar}
            disabled={enviando}
            className="flex-shrink-0 rounded-lg bg-oliva px-3 py-2 text-[12.5px] font-semibold text-hueso disabled:opacity-60"
          >
            Preguntar
          </button>
        </div>
      )}

      {!isLoggedIn && (
        <div className="rounded-lg border border-piedra/60 bg-hueso-2 p-3.5 text-center text-[13px] text-tinta">
          Necesitás iniciar sesión para preguntar.{" "}
          <Link href="/" className="font-semibold text-golfo">
            Abrir en Origen El Doradillo
          </Link>
        </div>
      )}
    </div>
  );
}
