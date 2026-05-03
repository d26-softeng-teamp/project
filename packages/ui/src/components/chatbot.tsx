import type * as webllm from "@mlc-ai/web-llm";
import { Bot, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatHistory } from "./chatbot/history";
import { ASSISTANT_TOOLS, DEFAULT_MODEL } from "./chatbot/knowledge";
import { ChatMessages } from "./chatbot/messages";
import { buildGreeting, buildSystemPrompt } from "./chatbot/prompt";
import { styles } from "./chatbot/styles";
import { ChatTitle } from "./chatbot/title";
import type { ChatMessage, ChatRole, CMSChatbotProps } from "./chatbot/types";
import { useWebLlmAssistant } from "./chatbot/use-web-llm-assistant";

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
}

function Launcher({ onSubmitQuestion }: { onSubmitQuestion?: (question: string) => void }) {
  const [value, setValue] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [visible, setVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);



  function submit() {
    const question = value.trim();
    if (!question) return;
    setValue("");
    onSubmitQuestion?.(question);
  }

  function toggleExpanded() {
    setExpanded((prev) => {
      if (!prev) {
        setVisible(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      } else {
        setTimeout(() => setVisible(false), 650);
      }
      return !prev;
    });
  }
  return (
      <div style={styles.launcherRoot}>
        <div style={{ ...styles.launcher, ...(expanded ? { width: 340 } : styles.launcherCollapsed) }}>
          <button
              type="button"
              onClick={toggleExpanded}
              style={styles.launcherIcon}
              aria-label={expanded ? "Collapse Gompei" : "Open Gompei"}
              aria-expanded={expanded}
          >
            <Bot size={17} aria-hidden="true" />
          </button>
          <div
              style={{
                ...styles.launcherInputWrap,
                ...(expanded ? null : styles.launcherInputWrapCollapsed),
                ...(!visible ? { display: "none" } : null),
              }}
              aria-hidden={!expanded}
          >
            <input
                ref={inputRef}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") { event.preventDefault(); submit(); }
                }}
                placeholder="Ask Gompei..."
                style={styles.launcherInput}
                aria-label="Ask Gompei"
                tabIndex={expanded ? 0 : -1}
            />
            <button type="button" onClick={submit} style={styles.launcherButton} aria-label="Ask" tabIndex={expanded ? 0 : -1}>
              <Send size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
  );
}

export default function CMSChatbot({
  context,
  initialPrompt,
  initialMessages,
  history = [],
  activeConversationId,
  mode = "launcher",
  modelId = DEFAULT_MODEL,
  onDeleteConversation,
  onNavigate,
  onNewConversation,
  onPersistMessage,
  onRunSiteAction,
  onSelectConversation,
  onSubmitQuestion,
}: CMSChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages ?? []);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialPromptSentRef = useRef(false);
  const lastConversationIdRef = useRef(activeConversationId);
  const nextId = useRef(0);

  const availableActions = useMemo(() => context.actions ?? [], [context.actions]);
  const systemPrompt = useMemo(
    () => buildSystemPrompt({ context, tools: ASSISTANT_TOOLS }),
    [context],
  );

  const appendMessage = useCallback((role: ChatRole, content: string) => {
    const message: ChatMessage = { id: `local-${nextId.current}`, role, content };
    nextId.current += 1;
    setMessages((current) => [...current, message]);
    return message;
  }, []);

  const updateMessage = useCallback((id: string | number, content: string) => {
    setMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, content } : message)),
    );
  }, []);

  const replaceMessage = useCallback((id: string | number, persistedMessage?: ChatMessage) => {
    if (!persistedMessage) return;
    setMessages((current) =>
      current.map((message) => (message.id === id ? persistedMessage : message)),
    );
  }, []);

  const persistMessage = useCallback(
    async (message: { role: ChatRole; content: string }) => {
      return onPersistMessage?.(message);
    },
    [onPersistMessage],
  );

  const handleReady = useCallback(() => {
    setMessages((current) => {
      if (current.length > 0 || initialPrompt?.trim()) {
        return current;
      }

      const greeting: ChatMessage = {
        id: `local-${nextId.current}`,
        role: "assistant",
        content: buildGreeting(context),
      };
      nextId.current += 1;
      return [greeting];
    });
  }, [context, initialPrompt]);

  const { complete, hasGpu, progress, status } = useWebLlmAssistant({
    enabled: mode === "page",
    modelId,
    onReady: handleReady,
  });

  useEffect(() => {
    if (lastConversationIdRef.current === activeConversationId) return;
    lastConversationIdRef.current = activeConversationId;
    initialPromptSentRef.current = false;
    setMessages(initialMessages ?? []);
  }, [activeConversationId, initialMessages]);

  useEffect(() => {
    if (!initialMessages) return;
    setMessages((current) => {
      if (current.length > initialMessages.length) return current;
      return initialMessages;
    });
  }, [initialMessages]);

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || status !== "ready") return;

      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      const userMessage = appendMessage("user", text);
      const assistantMessage = appendMessage("assistant", "");
      setIsTyping(true);

      const persistUserMessage = persistMessage({ role: "user", content: userMessage.content })
        .then((persistedMessage) => {
          replaceMessage(userMessage.id, persistedMessage);
          return persistedMessage;
        })
        .catch((error) => console.error("Gompei user message persist error:", error));

      const siteActionResult = await onRunSiteAction?.({ prompt: text });
      if (siteActionResult) {
        setIsTyping(false);
        updateMessage(assistantMessage.id, siteActionResult);
        await persistUserMessage;
        const persistedMessage = await persistMessage({
          role: "assistant",
          content: siteActionResult,
        });
        replaceMessage(assistantMessage.id, persistedMessage);
        return;
      }

      const chatMessages: webllm.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
        { role: "user", content: userMessage.content },
      ];

      try {
        let finalContent = "";
        await complete({
          messages: chatMessages,
          onToken: (content) => {
            finalContent = content;
            setIsTyping(false);
            updateMessage(assistantMessage.id, content);
          },
        });
        if (finalContent.trim()) {
          await persistUserMessage;
          const persistedMessage = await persistMessage({
            role: "assistant",
            content: finalContent,
          });
          replaceMessage(assistantMessage.id, persistedMessage);
        }
      } catch (error) {
        console.error("Gompei chat error:", error);
        updateMessage(
          assistantMessage.id,
          "I could not finish that response. Give me a moment, then try again.",
        );
      } finally {
        setIsTyping(false);
      }
    },
    [
      appendMessage,
      complete,
      input,
      messages,
      onRunSiteAction,
      persistMessage,
      replaceMessage,
      status,
      systemPrompt,
      updateMessage,
    ],
  );

  useEffect(() => {
    const question = initialPrompt?.trim();
    if (!question || status !== "ready" || initialPromptSentRef.current) return;

    initialPromptSentRef.current = true;
    void sendMessage(question);
  }, [initialPrompt, sendMessage, status]);

  function handleTextareaChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value);
    resizeTextarea(event.target);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  if (mode === "launcher") {
    return <Launcher onSubmitQuestion={onSubmitQuestion} />;
  }

  const isDisabled = status !== "ready";

  return (
    <section style={styles.pageRoot}>
      <ChatTitle progress={progress} status={status} />

      <div style={styles.pageWorkspace}>
        <ChatHistory
          activeConversationId={activeConversationId}
          history={history}
          onDeleteConversation={onDeleteConversation}
          onNewConversation={onNewConversation}
          onSelectConversation={onSelectConversation}
        />

        <main style={styles.chatPanel}>
          {!hasGpu ? (
            <div style={styles.gpuWarning}>
              Gompei needs WebGPU locally. Use Chrome 113+ or Edge 113+ for chat.
            </div>
          ) : null}

          {status === "loading" ? (
            <div style={styles.loadPane}>
              <div style={styles.loadHeader}>
                <Sparkles size={15} aria-hidden="true" />
                <span>Preparing Gompei</span>
              </div>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "#164734",
                    borderRadius: 999,
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <div style={styles.progressLabel}>{progress}%</div>
            </div>
          ) : null}

          <ChatMessages
            availableActions={availableActions}
            contextUserName={context.user.name}
            isTyping={isTyping}
            messages={messages}
            onNavigate={onNavigate}
          />

          <div style={styles.pageInputRow}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={isDisabled}
              placeholder="Ask Gompei anything about iBank..."
              rows={1}
              style={{ ...styles.pageTextarea, opacity: isDisabled ? 0.45 : 1 }}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={isDisabled}
              style={{ ...styles.sendButton, opacity: isDisabled ? 0.35 : 1 }}
              aria-label="Send message"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.42} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
      `}</style>
    </section>
  );
}
