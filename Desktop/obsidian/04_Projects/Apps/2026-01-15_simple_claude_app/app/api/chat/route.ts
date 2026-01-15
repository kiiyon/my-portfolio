
import { Anthropic } from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages) {
            return new Response("Messages are required", { status: 400 });
        }

        // 最新のユーザーメッセージを取得（保存用）
        const lastUserMessage = messages[messages.length - 1];

        // システムプロンプト（必要に応じて）
        const systemPrompt = "You are Claude, a helpful and intelligent AI assistant.";

        const responseStream = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            messages: messages.map((m: any) => ({
                role: m.role,
                content: m.content,
            })),
            stream: true,
        });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                let accumulatedText = "";

                try {
                    for await (const chunk of responseStream) {
                        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                            const text = chunk.delta.text;
                            accumulatedText += text;
                            controller.enqueue(encoder.encode(text));
                        }
                    }
                } catch (e) {
                    console.error("Stream error:", e);
                    controller.error(e);
                } finally {
                    controller.close();

                    // ストリーム終了後にSupabaseへ保存
                    if (supabase && lastUserMessage.role === 'user') {
                        try {
                            const { error } = await supabase
                                .from('Question')
                                .insert({
                                    question: lastUserMessage.content,
                                    answer: accumulatedText,
                                    // created_at は Supabase側でデフォルト値があれば自動設定される
                                });

                            if (error) {
                                console.error("Supabase insert error:", error);
                            } else {
                                console.log("Saved to Supabase successfully");
                            }
                        } catch (err) {
                            console.error("Supabase connection error:", err);
                        }
                    } else {
                        console.log("Skipping Supabase save: No client or invalid message role.");
                    }
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error: any) {
        console.error("Error calling Claude API:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
