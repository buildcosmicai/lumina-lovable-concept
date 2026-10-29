import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ArrowUp, CalendarDays, Copy, LayoutTemplate, ListVideo, LoaderCircle, Monitor, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse, MessageAction, MessageActions } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { RelayMark, useAssistantWorkspace } from "./assistant-workspace";
import { supabase } from "@/integrations/supabase/client";
import { getAssistantThread } from "@/lib/assistant.functions";
import { toast } from "sonner";

const starters = [
  { icon: LayoutTemplate, label: "Create something", text: "Draft a welcoming lobby screen", prompt: "Draft concise welcoming copy for a lobby signage screen. Give me a headline, a short welcome line and a useful footer." },
  { icon: Monitor, label: "Solve a problem", text: "Troubleshoot an offline screen", prompt: "Help me troubleshoot an offline signage screen. What should I check first?" },
  { icon: CalendarDays, label: "Plan ahead", text: "Shape a weekly content schedule", prompt: "Help me plan a weekday signage content schedule. Ask me about my audience and opening hours first." },
  { icon: ListVideo, label: "Find a better flow", text: "Build a balanced playlist", prompt: "Help me structure a balanced lobby playlist with welcome messages, brand content and useful information." },
];

export function AssistantThreadPage({ threadId }: { threadId: string }) {
  const { signedIn, ready, requestSignIn } = useAssistantWorkspace();
  const getThread = useServerFn(getAssistantThread);
  const [thread, setThread] = useState<{ messages: UIMessage[] } | null>(null); const [error, setError] = useState("");
  const load = async () => { setError(""); try { const result = await getThread({ data: { id: threadId } }); setThread({ messages: result.messages as unknown as UIMessage[] }); } catch (error) { setError(error instanceof Error ? error.message : "Conversation unavailable."); } };
  useEffect(() => { if (signedIn) void load(); else setThread(null); }, [signedIn, threadId]);
  if (!ready || (signedIn && !thread && !error)) return <div className="grid flex-1 place-items-center"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>;
  if (!signedIn) return <div className="grid flex-1 place-items-center p-6"><Button onClick={requestSignIn}>Sign in to open this conversation</Button></div>;
  if (error) return <div className="grid flex-1 place-items-center p-6"><div className="text-center"><p role="alert" className="text-sm text-destructive">{error}</p><Button variant="outline" className="mt-4" onClick={() => void load()}>Try again</Button></div></div>;
  return thread ? <AssistantChat key={threadId} threadId={threadId} initialMessages={thread.messages} /> : null;
}

export function AssistantChat({ threadId, initialMessages = [] }: { threadId?: string; initialMessages?: UIMessage[] }) {
  const workspace = useAssistantWorkspace(); const input = useRef<HTMLTextAreaElement>(null); const [draft, setDraft] = useState("");
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/assistant", body: { threadId }, headers: async () => {
    const { data } = await supabase.auth.getSession(); return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  } }), [threadId]);
  const { messages, sendMessage, status, error, stop } = useChat({ id: threadId ?? "relay-new", messages: initialMessages, transport, onFinish: () => { void workspace.refresh(); }, onError: error => toast.error(error.message) });
  const busy = status === "submitted" || status === "streaming";
  const pendingSent = useRef(false);
  useEffect(() => { input.current?.focus(); }, [threadId, status]);
  useEffect(() => {
    if (threadId && workspace.pendingPrompt && !pendingSent.current && !initialMessages.length) {
      pendingSent.current = true; const text = workspace.pendingPrompt; workspace.setPendingPrompt(""); void sendMessage({ text });
    }
  }, [threadId, workspace.pendingPrompt, workspace.setPendingPrompt, initialMessages.length, sendMessage]);
  const submit = async (text: string) => {
    if (!text.trim() || busy) return;
    if (!workspace.signedIn) { setDraft(text); workspace.requestSignIn(); return; }
    if (!threadId) { workspace.setPendingPrompt(text); await workspace.newThread(); return; }
    setDraft(""); input.current?.focus(); await sendMessage({ text });
  };
  return <main className="flex min-h-0 flex-1 flex-col">
    <Conversation className="min-h-0" ><ConversationContent className="mx-auto w-full max-w-[860px] gap-7 px-5 pb-8 pt-8 md:px-9">
      {!messages.length ? <div className="py-6 md:py-12"><div className="mb-8 flex items-center gap-3"><RelayMark className="size-14" /><div><p className="font-display text-xl font-semibold">Relay<span className="ml-2 align-middle font-mono text-[10px] text-accent">AI</span></p><p className="mt-1 text-xs text-muted-foreground">A little clarity for every screen.</p></div></div><h2 className="max-w-xl font-display text-3xl font-medium leading-[1.3] md:text-4xl">What’s next for<br /><span className="text-accent">your screens?</span></h2><p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Let’s turn a rough idea into your next great screen.</p>
        <div className="mt-9 grid gap-3 sm:grid-cols-2">{starters.map(item => <Button key={item.label} variant="outline" className="h-auto min-h-28 items-start justify-start gap-3 whitespace-normal bg-card p-4 text-left hover:bg-secondary hover:text-foreground" onClick={() => { setDraft(item.prompt); input.current?.focus(); }}><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-surface text-accent"><item.icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{item.label}</span><span className="mt-2 block text-xs font-normal leading-5 text-muted-foreground">{item.text}</span></span><ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" /></Button>)}</div>
      </div> : messages.map(message => <Message key={message.id} from={message.role} className="max-w-full"><div className={message.role === "assistant" ? "flex gap-3" : ""}>{message.role === "assistant" && <RelayMark className="mt-1 size-7 shrink-0" />}<div className="min-w-0 flex-1"><MessageContent className={message.role === "user" ? "group-[.is-user]:bg-secondary group-[.is-user]:text-secondary-foreground" : "w-full leading-7"}>{message.parts.map((part, index) => part.type === "text" ? <MessageResponse key={index} isAnimating={busy && message.id === messages.at(-1)?.id}>{part.text}</MessageResponse> : part.type === "reasoning" && part.text ? <Reasoning key={index} defaultOpen={false} isStreaming={busy && message.id === messages.at(-1)?.id}><ReasoningTrigger /><ReasoningContent>{part.text}</ReasoningContent></Reasoning> : null)}</MessageContent>{message.role === "assistant" && message.parts.some(p => p.type === "text" && p.text) && <MessageActions className="mt-2"><MessageAction tooltip="Copy answer" onClick={() => { void navigator.clipboard.writeText(message.parts.filter(p => p.type === "text").map(p => p.text).join("\n")); toast.success("Answer copied"); }}><Copy className="size-3.5" /></MessageAction></MessageActions>}</div></div></Message>)}
      {busy && !messages.at(-1)?.parts.some(p => p.type === "text" && p.text) && <div className="flex items-center gap-3" role="status"><RelayMark className="size-7" /><Shimmer>Thinking…</Shimmer></div>}
      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error.message}</p>}
    </ConversationContent><ConversationScrollButton /></Conversation>
    <div className="mx-auto w-full max-w-[860px] shrink-0 px-5 pb-5 md:px-9"><PromptInput onSubmit={({ text }) => submit(text)} className="rounded-lg bg-card shadow-panel"><PromptInputTextarea ref={input} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Ask Relay about your signage…" aria-label="Message Relay" className="min-h-20 px-4 text-sm" /><PromptInputFooter className="justify-between px-3 pb-3"><span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5" />{workspace.signedIn ? "Saved to your account" : "Private conversations"}</span><PromptInputSubmit status={status} onStop={() => stop()} disabled={!busy && !draft.trim()} className="size-8" title={busy ? "Stop response" : "Send message"}>{!busy && <ArrowUp className="size-4" />}</PromptInputSubmit></PromptInputFooter></PromptInput><p className="mt-3 text-center text-[10px] text-muted-foreground">Relay can make mistakes. Review important details before publishing.</p></div>
  </main>;
}