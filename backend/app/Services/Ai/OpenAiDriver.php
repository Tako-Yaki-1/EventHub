<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAiDriver extends HttpAiClient
{
    public function complete(string $system, array $messages, int $maxOutputTokens): array
    {
        $startedAt = $this->start();

        $baseUrl = rtrim((string) (config('ai.base_url') ?: 'https://api.openai.com/v1'), '/');

        $response = Http::withToken((string) config('ai.api_key'))
            ->timeout((int) config('ai.timeout_seconds', 15))
            ->retry(2, 200, throw: false)
            ->post($baseUrl.'/chat/completions', [
                'model' => (string) config('ai.model'),
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ...$messages,
                ],
                'max_tokens' => $maxOutputTokens,
            ]);

        if ($response->failed()) {
            throw new RuntimeException("AI provider returned HTTP {$response->status()}.");
        }

        $text = (string) data_get($response->json(), 'choices.0.message.content');
        $prompt = $system.collect($messages)->pluck('content')->implode('');

        return $this->normalise(
            $text,
            (int) data_get($response->json(), 'usage.prompt_tokens', 0),
            (int) data_get($response->json(), 'usage.completion_tokens', 0),
            $prompt,
            $this->elapsedMs($startedAt),
        );
    }
}
