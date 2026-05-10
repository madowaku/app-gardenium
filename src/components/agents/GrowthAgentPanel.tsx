import { useEffect, useState } from "react";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { authenticatedFetch } from "../../lib/authenticatedFetch";
import type { AgentLanguage, AgentSuggestion } from "../../types/agents";
import AgentSuggestionCard from "./AgentSuggestionCard";

type GrowthAgentPanelProps = {
  ideaId: string;
  ownerUserId: string;
  currentUserId?: string;
  language?: AgentLanguage;
};

export default function GrowthAgentPanel({
  ideaId,
  ownerUserId,
  currentUserId,
  language = "ja",
}: GrowthAgentPanelProps) {
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [busySuggestionId, setBusySuggestionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isOwner = !!currentUserId && currentUserId === ownerUserId;

  useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;

    const loadSuggestions = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await authenticatedFetch(`/api/agents/ideas/${ideaId}/suggestions`);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to load Growth Agent suggestions.");
        }
        const body = await response.json();
        if (!cancelled) {
          setSuggestions(body.suggestions || []);
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || "Failed to load Growth Agent suggestions.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, [ideaId, isOwner]);

  if (!isOwner) {
    return null;
  }

  const runGrowthReview = async () => {
    setRunning(true);
    setError("");
    try {
      const response = await authenticatedFetch("/api/agents/growth-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, language }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error || "Failed to run Growth Agent.");
      }
      setSuggestions(body.suggestions || []);
    } catch (runError: any) {
      setError(runError?.message || "Failed to run Growth Agent.");
    } finally {
      setRunning(false);
    }
  };

  const updateSuggestion = async (id: string, endpoint: string) => {
    setBusySuggestionId(id);
    setError("");
    try {
      const response = await authenticatedFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionId: id }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error || "Failed to update suggestion.");
      }
      setSuggestions((current) =>
        current.map((suggestion) => (suggestion.id === id ? body.suggestion : suggestion)),
      );
    } catch (updateError: any) {
      setError(updateError?.message || "Failed to update suggestion.");
    } finally {
      setBusySuggestionId(null);
    }
  };

  return (
    <section className="rounded-[28px] border border-primary/20 bg-primary-light/40 p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm">
            <Bot size={13} />
            Growth Agent
          </div>
          <h3 className="text-2xl font-serif font-bold text-text-dark">
            {language === "ja" ? "AI Growth Review" : "AI Growth Review"}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
            {language === "ja"
              ? "このアプリ案を診断して、MVP計画・テスター募集・審査準備度・SNS投稿文を作ります。"
              : "Diagnose this app idea and generate an MVP plan, tester strategy, store readiness, and share copy."}
          </p>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-text-muted/80">
            {language === "ja"
              ? "審査診断は承認保証ではありません。提出前の準備論点を見える化するためのAI提案です。"
              : "Store readiness is not an approval guarantee. It highlights preparation risks before submission."}
          </p>
        </div>
        <button
          type="button"
          onClick={runGrowthReview}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-text-dark px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
          {language === "ja" ? "AI Growth Reviewを作成" : "Create AI Growth Review"}
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 rounded-[18px] border border-border-color bg-white px-5 py-4 text-sm text-text-muted">
          <Loader2 size={17} className="animate-spin text-primary" />
          {language === "ja" ? "提案を読み込んでいます" : "Loading suggestions"}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id}>
              <AgentSuggestionCard
                suggestion={suggestion}
                language={language}
                busy={busySuggestionId === suggestion.id}
                onApply={(id) => updateSuggestion(id, "/api/agents/apply-suggestion")}
                onDismiss={(id) => updateSuggestion(id, "/api/agents/dismiss-suggestion")}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-dashed border-primary/25 bg-white/70 px-5 py-5 text-sm leading-relaxed text-text-muted">
          {language === "ja"
            ? "まだAI提案はありません。デモではここから診断カードを生成できます。"
            : "No AI suggestions yet. Generate review cards from here for the demo."}
        </div>
      )}
    </section>
  );
}
