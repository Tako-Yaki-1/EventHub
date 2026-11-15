<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class AnthropicDriver extends HttpAiClient
{
    public function complete(string $system, array $messages, int $maxOutputTokens): array
    {
        $startedAt = $this->start();

        $response = Http::withHeaders([
            'x-api-key' => (string) config('ai.api_key'),
            'anthropic-version' => '2023-06-01',
        ])
            ->timeout((int) config('ai.timeout_seconds', 15))
            ->retry(2, 200, throw: false)
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => (string) config('ai.model'),
                'max_tokens' => $maxOutputTokens,
                'system' => $system,
                'messages' => $messages,
            ]);

        if ($response->failed()) {
            throw new RuntimeException("AI provider returned HTTP {$response->status()}.");
        }

        $text = (string) data_get($response->json(), 'content.0.text');
        $prompt = $system.collect($messages)->pluck('content')->implode('');

        return $this->normalise(
            $text,
            (int) data_get($response->json(), 'usage.input_tokens', 0),
            (int) data_get($response->json(), 'usage.output_tokens', 0),
            $prompt,
            $this->elapsedMs($startedAt),
        );
    }
}
