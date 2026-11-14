<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\CancelRegistration;
use App\Actions\RegisterForEvent;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRegistrationRequest;
use App\Http\Resources\RegistrationResource;
use App\Models\Event;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class RegistrationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $registrations = Registration::query()
            ->with(['event' => fn ($query) => $query->withRegisteredCount()])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('registered_at')
            ->paginate(12);

        return RegistrationResource::collection($registrations);
    }

    public function store(
        StoreRegistrationRequest $request,
        Event $event,
        RegisterForEvent $registerForEvent,
    ): JsonResponse {
        $registration = $registerForEvent->handle($event, $request->user(), $request->validated());

        return response()->json([
            'message' => 'You are registered.',
            'data' => (new RegistrationResource($registration))->resolve(),
        ], 201);
    }

    public function destroy(
        Registration $registration,
        CancelRegistration $cancelRegistration,
    ): JsonResponse {
        Gate::authorize('cancel', $registration);

        $registration = $cancelRegistration->handle($registration);

        return response()->json([
            'message' => 'Registration cancelled.',
            'data' => (new RegistrationResource($registration->load([
                'event' => fn ($query) => $query->withRegisteredCount(),
            ])))->resolve(),
        ]);
    }
}
