import { Check, Clipboard, Loader2, Share2, ShieldCheck, X } from "lucide-react";
import type { AgentLanguage, AgentSuggestion } from "../../types/agents";

type AgentSuggestionCardProps = {
  suggestion: AgentSuggestion;
  language: AgentLanguage;
  onApply: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  busy?: boolean;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function labelForType(type: AgentSuggestion["type"], language: AgentLanguage) {
  const labels = {
    idea_diagnosis: { ja: "アイデア診断", en: "Idea Diagnosis" },
    mvp_plan: { ja: "MVP計画", en: "MVP Plan" },
    tester_strategy: { ja: "テスター戦略", en: "Tester Strategy" },
    public_pitch: { ja: "公開ページ文言", en: "Public Pitch" },
    progress_next_action: { ja: "次の一手", en: "Next Actions" },
    store_review_readiness: { ja: "審査通過リスク診断", en: "Store Review Readiness" },
    share_boost: { ja: "Share Boost", en: "Share Boost" },
  };
  return labels[type]?.[language] || type;
}

function primaryItems(suggestion: AgentSuggestion) {
  switch (suggestion.type) {
    case "idea_diagnosis":
      return [
        ...asStringArray(suggestion.content.targetUsers).slice(0, 2),
        ...asStringArray(suggestion.content.risks).slice(0, 2),
      ];
    case "mvp_plan":
      return [
        ...asStringArray(suggestion.content.mustHaveFeatures).slice(0, 3),
        ...asStringArray(suggestion.content.firstWeekTasks).slice(0, 2),
      ];
    case "tester_strategy":
      return [
        typeof suggestion.content.idealTesterPersona === "string" ? suggestion.content.idealTesterPersona : "",
        ...asStringArray(suggestion.content.feedbackQuestions).slice(0, 3),
      ].filter(Boolean);
    case "public_pitch":
      return [
        suggestion.content.shortPitch,
        suggestion.content.seoDescription,
        suggestion.content.xPost,
      ].filter((item): item is string => typeof item === "string" && item.length > 0);
    case "progress_next_action":
      return asStringArray(suggestion.content.actions).slice(0, 3);
    case "store_review_readiness":
      return [
        `Score: ${String(suggestion.content.overallScore || "-")}/100`,
        `Risk: ${String(suggestion.content.riskLevel || "-")}`,
        ...asStringArray(suggestion.content.requiredAssets).slice(0, 3),
        typeof suggestion.content.disclaimer === "string" ? suggestion.content.disclaimer : "",
      ].filter(Boolean);
    case "share_boost":
      return [
        suggestion.content.shortPost,
        suggestion.content.friendlyPost,
        suggestion.content.testerCallPost,
        asStringArray(suggestion.content.hashtags).join(" "),
      ].filter((item): item is string => typeof item === "string" && item.length > 0);
    default:
      return [];
  }
}

export default function AgentSuggestionCard({
  suggestion,
  language,
  onApply,
  onDismiss,
  busy = false,
}: AgentSuggestionCardProps) {
  const isApplied = suggestion.status === "accepted";
  const isDismissed = suggestion.status === "dismissed";
  const disabled = busy || isApplied || isDismissed;
  const items = primaryItems(suggestion);
  const icon = suggestion.type === "store_review_readiness"
    ? <ShieldCheck size={13} />
    : suggestion.type === "share_boost"
      ? <Share2 size={13} />
      : null;

  const copySuggestion = async () => {
    await navigator.clipboard?.writeText(
      [suggestion.title, suggestion.summary, ...items.map((item) => `- ${item}`)].join("\n"),
    );
  };

  return (
    <article className="rounded-[24px] border border-border-color bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            {icon}
            {labelForType(suggestion.type, language)}
          </span>
          <h4 className="text-lg font-bold text-text-dark">{suggestion.title}</h4>
        </div>
        {suggestion.status !== "draft" && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isApplied ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-text-muted"}`}>
            {isApplied ? (language === "ja" ? "採用済み" : "Applied") : (language === "ja" ? "却下済み" : "Dismissed")}
          </span>
        )}
      </div>

      <p className="mb-5 text-sm leading-relaxed text-text-muted">{suggestion.summary}</p>

      {items.length > 0 && (
        <ul className="mb-6 space-y-2">
          {items.map((item, index) => (
            <li key={`${suggestion.id}-${index}`} className="flex gap-2 text-sm leading-relaxed text-text-dark">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onApply(suggestion.id)}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {language === "ja" ? "採用する" : "Apply"}
        </button>
        <button
          type="button"
          onClick={() => onDismiss(suggestion.id)}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-full border border-border-color bg-bg-card px-4 py-2 text-sm font-bold text-text-muted transition-colors hover:bg-bg-main disabled:cursor-not-allowed disabled:opacity-45"
        >
          <X size={15} />
          {language === "ja" ? "却下" : "Dismiss"}
        </button>
        <button
          type="button"
          onClick={copySuggestion}
          className="inline-flex items-center gap-2 rounded-full border border-border-color bg-bg-card px-4 py-2 text-sm font-bold text-text-muted transition-colors hover:bg-bg-main"
        >
          <Clipboard size={15} />
          {language === "ja" ? "コピー" : "Copy"}
        </button>
      </div>
    </article>
  );
}
