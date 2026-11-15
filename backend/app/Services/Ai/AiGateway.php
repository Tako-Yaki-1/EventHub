<?php

namespace App\Services\Ai;

use App\Contracts\AiClient;
use App\Models\AiRequest;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\RateLimiter;
use Throwable;

class AiGateway
{
    public function __construct(
        private AiClient $client,
        private AiSettings $settings,
        private AuditLogger $audit,
    ) {}

    /**
     * Guard, call, record, and audit one AI request. Never throws for provider problems.
     *
     * @param  list<array{role: string, content: string}>  $messages
     */
    public function call(User $user, string $feature, string $system, array $messages): AiCallResult
    {
        $prompt = $system.collect($messages)->pluck('content')->implode('');
        $promptChars = mb_strlen($prompt);
        $promptHash = hash('sha256', $prompt);

        if (! $this->settings->enabledFor($feature)) {
            return $this->record($user, $feature, 'fallback', 'ai_disabled', $prompt, $promptChars, $promptHash);
        }

        if (! $this->configured()) {
            return $this->record($user, $feature, 'fallback', 'not_configured', $prompt, $promptChars, $promptHash);
        }

        if ($this->rateLimited($user)) {
            return $this->record(
                $user, $feature, 'rate_limited', 'rate_limited', $prompt, $promptChars, $promptHash,
                message: 'Too many AI requests. Try again in a minute.',
            );
        }

        if ($this->overDailyLimit($user, $promptChars)) {
            return $this->record(
                $user, $feature, 'blocked', 'daily_token_limit', $prompt, $promptChars, $promptHash,
                message: 'You have reached your daily AI limit. Try again tomorrow.',
            );
        }

        try {
            $response = $this->client->complete(
                $system,
                $messages,
                (int) config('ai.max_output_tokens', 500),
            );
        } catch (Throwable) {
            return $this->record($user, $feature, 'fallback', 'provider_error', $prompt, $promptChars, $promptHash);
        }

        return $this->record(
            $user, $feature, 'success', null, $prompt, $promptChars, $promptHash,
            usage: $response,
        );
    }

    public function tokensUsedToday(User $user): int
    {
        return (int) AiRequest::query()
            ->where('user_id', $user->id)
            ->whereDate('created_at', today())
            ->sum('total_tokens');
    }

    public function remainingTokens(User $user): int
    {
        return max(0, $this->settings->dailyTokenLimit() - $this->tokensUsedToday($user));
    }

    /**
     * The request costs at least its prompt estimate plus the output ceiling.
     */
    private function overDailyLimit(User $user, int $promptChars): bool
    {
        $estimate = (int) ceil($promptChars / 4) + (int) config('ai.max_output_tokens', 500);

        return $this->tokensUsedToday($user) + $estimate > $this->settings->dailyTokenLimit();
    }

    private function rateLimited(User $user): bool
    {
        $key = 'ai:'.$user->id;

        if (RateLimiter::tooManyAttempts($key, (int) config('ai.requests_per_minute', 10))) {
            return true;
        }

        RateLimiter::hit($key, 60);

        return false;
    }

    private function configured(): bool
    {
        if (config('ai.driver') === 'fake') {
            return true;
        }

        return in_array(config('ai.driver'), ['anthropic', 'openai'], true)
            && filled(config('ai.api_key'))
            && filled(config('ai.model'));
    }

    /**
     * @param  array{text: string, input_tokens: int, output_tokens: int, latency_ms: int, tokens_estimated: bool}|null  $usage
     */
    private function record(
        User $user,
        string $feature,
        string $status,
        ?string $errorCode,
        string $prompt,
        int $promptChars,
        string $promptHash,
        ?array $usage = null,
        ?string $message = null,
    ): AiCallResult {
        $inputTokens = $usage['input_tokens'] ?? 0;
        $outputTokens = $usage['output_tokens'] ?? 0;
        $totalTokens = $inputTokens + $outputTokens;
        $estimated = (bool) ($usage['tokens_estimated'] ?? false);

        AiRequest::create([
            'user_id' => $user->id,
            'feature' => $feature,
            'driver' => (string) config('ai.driver'),
            'model' => (string) config('ai.model'),
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'total_tokens' => $totalTokens,
            'tokens_estimated' => $estimated,
            'latency_ms' => $usage['latency_ms'] ?? 0,
            'status' => $status,
            'error_code' => $errorCode,
            'prompt_chars' => $promptChars,
            'prompt_hash' => $promptHash,
            'prompt' => config('ai.log_prompts') ? $prompt : null,
            'created_at' => now(),
        ]);

        $this->audit->record(
            'ai.request',
            $status === 'success' ? 'success' : ($status === 'fallback' ? 'failed' : 'denied'),
            user: $user,
            metadata: [
                'feature' => $feature,
                'status' => $status,
                'input_tokens' => $inputTokens,
                'output_tokens' => $outputTokens,
                'total_tokens' => $totalTokens,
                'tokens_estimated' => $estimated,
                'error_code' => $errorCode,
            ],
        );

        return new AiCallResult($status, $usage['text'] ?? null, $errorCode, $message);
    }
}
