<?php

namespace App\Services\Ai;

use App\Contracts\AiClient;

abstract class HttpAiClient implements AiClient
{
    protected function start(): int
    {
        return hrtime(true);
    }

    protected function elapsedMs(int $startedAt): int
    {
        return (int) round((hrtime(true) - $startedAt) / 1_000_000);
    }

    /**
     * Providers sometimes omit usage numbers; a rough characters / 4 estimate keeps limits working.
     */
    protected function estimateTokens(string $text): int
    {
        return (int) ceil(mb_strlen($text) / 4);
    }

    /**
     * @return array{text: string, input_tokens: int, output_tokens: int, latency_ms: int, tokens_estimated: bool}
     */
    protected function normalise(string $text, int $inputTokens, int $outputTokens, string $prompt, int $latencyMs): array
    {
        $estimated = $inputTokens === 0 || $outputTokens === 0;

        return [
            'text' => $text,
            'input_tokens' => $inputTokens ?: $this->estimateTokens($prompt),
            'output_tokens' => $outputTokens ?: $this->estimateTokens($text),
            'latency_ms' => $latencyMs,
            'tokens_estimated' => $estimated,
        ];
    }
}
