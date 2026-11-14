<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\CancelRegistration;
use App\Actions\RegisterForEvent;
use App\Enums\RegistrationStatus;
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
        $registered = RegistrationStatus::Registered->value;

        $registrations = Registration::query()
            ->select('registrations.*')
            ->leftJoin('events', 'events.id', '=', 'registrations.event_id')
            ->with(['event' => fn ($query) => $query->withRegisteredCount()])
            ->where('registrations.user_id', $request->user()->id)
            // Active registrations first, soonest event first; then cancelled, most recent first.
            ->orderByRaw('case when registrations.status = ? then 0 else 1 end', [$registered])
            ->orderByRaw('case when registrations.status = ? then events.starts_at end asc', [$registered])
            ->orderByRaw('case when registrations.status <> ? then registrations.cancelled_at end desc', [$registered])
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
