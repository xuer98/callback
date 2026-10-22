import "server-only";
import Anthropic, { APIError } from "@anthropic-ai/sdk";

// The streaming half shared by the chat routes (the interviewer on design
// problems, the assistant on every problem): one client, one way to explain
// a rejected request, and one ReadableStream that forwards the model's text
// as it arrives and hands the finished reply to the route for persistence.

export const CHAT_MODEL = "claude-opus-5";

export function anthropicClient(): Anthropic {
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  return new Anthropic({
    defaultHeaders: workspaceId
      ? { "anthropic-workspace-id": workspaceId }
      : undefined,
  });
}

/** The API's own one-line reason — no secrets. */
function upstreamDetail(err: APIError): string {
  const body = err.error as { error?: { message?: unknown } } | undefined;
  const message = body?.error?.message;
  return typeof message === "string" ? message : err.message;
}

/**
 * "<who> didn't answer — <why>." for a request the API rejected before
 * streaming, with the API's own reason so a misconfigured key is diagnosable
 * from the page.
 */
export function upstreamFailure(err: unknown, who: string): string {
  if (!(err instanceof APIError)) {
    return `${who} didn't answer — couldn't reach the chat backend.`;
  }
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  const hint =
    err.status === 401
      ? "the server's ANTHROPIC_API_KEY was rejected"
      : err.status === 404
        ? workspaceId
          ? "this API key can't use the chat model or the configured ANTHROPIC_WORKSPACE_ID"
          : `this API key can't use the chat model (${CHAT_MODEL})`
        : err.status === 429
          ? "the chat backend is rate-limited right now"
          : (err.status ?? 0) >= 500
            ? "the chat backend is overloaded — try again in a minute"
            : "the chat backend rejected the request";
  return `${who} didn't answer — ${hint}. (${upstreamDetail(err)})`;
}

export interface ReplyUsage {
  /** Input tokens including what the prompt cache read or wrote. */
  inputTokens: number;
  outputTokens: number;
}

/**
 * The text of a streaming Messages API call as a markdown response. Once
 * the reply is complete, `onDone` gets the text to store (the reply plus
 * any refusal note) and the token counts; it is skipped when the model
 * produced nothing. A failure mid-reply appends a note instead, so nothing
 * half-finished is saved and the user knows to ask again. Closing the
 * reader aborts the upstream call.
 */
export function streamReply({
  upstream,
  aborter,
  refusalNote,
  label,
  onDone,
}: {
  upstream: AsyncIterable<Anthropic.RawMessageStreamEvent>;
  aborter: AbortController;
  /** Appended when the model refuses, e.g. "*The assistant declined.*". */
  refusalNote: string;
  /** Names the route in server logs. */
  label: string;
  onDone: (stored: string, usage: ReplyUsage) => Promise<void>;
}): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      /** Text the model actually produced — the persistence gate. */
      let replyText = "";
      let stored = "";
      let stopReason: string | null = null;
      let inputTokens = 0;
      let outputTokens = 0;
      try {
        for await (const event of upstream) {
          if (event.type === "message_start") {
            const usage = event.message.usage;
            inputTokens =
              usage.input_tokens +
              (usage.cache_read_input_tokens ?? 0) +
              (usage.cache_creation_input_tokens ?? 0);
          } else if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            replyText += event.delta.text;
            stored += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          } else if (event.type === "message_delta") {
            stopReason = event.delta.stop_reason ?? stopReason;
            outputTokens = event.usage.output_tokens;
          }
        }
        if (stopReason === "refusal") {
          const note = `\n\n${refusalNote}`;
          stored += note;
          controller.enqueue(encoder.encode(note));
        }
        if (replyText.trim() !== "") {
          await onDone(stored, { inputTokens, outputTokens });
        }
        controller.close();
      } catch (err) {
        // The reader going away cancels the stream (below) and the upstream
        // call, which then throws here: nothing to log or append.
        if (aborter.signal.aborted) return;
        console.error(`${label} stream failed mid-reply:`, err);
        try {
          controller.enqueue(
            encoder.encode(
              "\n\n*The reply was cut off by an upstream error and wasn't saved — ask again.*",
            ),
          );
          controller.close();
        } catch {
          // Stream already cancelled.
        }
      }
    },
    cancel() {
      // Reader went away — stop paying for tokens.
      aborter.abort();
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
