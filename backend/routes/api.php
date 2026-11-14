<?php

use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\EventController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\RegistrationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::put('profile', [ProfileController::class, 'update']);

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead']);

        Route::get('events', [EventController::class, 'index']);
        Route::get('events/{event}', [EventController::class, 'show']);

        Route::middleware('role:student')->group(function () {
            Route::get('my/registrations', [RegistrationController::class, 'index']);
            Route::post('events/{event}/registrations', [RegistrationController::class, 'store']);
            Route::delete('registrations/{registration}', [RegistrationController::class, 'destroy']);
        });

        Route::middleware('role:admin')->group(function () {
            Route::post('events', [EventController::class, 'store']);
            Route::put('events/{event}', [EventController::class, 'update']);
            Route::delete('events/{event}', [EventController::class, 'destroy']);
            Route::get('events/{event}/registrations', [EventController::class, 'attendees']);

            Route::prefix('admin/analytics')->group(function () {
                Route::get('summary', [AnalyticsController::class, 'summary']);
                Route::get('registrations-over-time', [AnalyticsController::class, 'registrationsOverTime']);
                Route::get('events-performance', [AnalyticsController::class, 'eventsPerformance']);
                Route::get('top-events', [AnalyticsController::class, 'topEvents']);
                Route::get('by-year-section', [AnalyticsController::class, 'byYearSection']);
                Route::get('insights', [AnalyticsController::class, 'insights']);
            });
        });
    });
});
