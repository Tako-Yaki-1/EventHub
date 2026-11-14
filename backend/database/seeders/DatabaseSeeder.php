<?php

namespace Database\Seeders;

use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Campus times are authored in Manila wall-clock time, stored as UTC.
        $at = fn (int $days, int $hour) => now('Asia/Manila')->addDays($days)->setTime($hour, 0)->utc();

        User::factory()->admin()->create([
            'name' => 'EventHub Admin',
            'email' => 'admin@eventhub.test',
            'password' => 'password',
        ]);

        $demoStudent = User::factory()->create([
            'name' => 'Jan Niño',
            'email' => 'jan.nino@school.edu',
            'student_id' => '2023-00123',
            'year_section' => 'BSIT 3B',
            'password' => 'password',
        ]);

        User::factory(60)->create();

        $events = collect([
            [
                'title' => 'Tech Talk: Building Better Apps',
                'description' => 'A practical talk on shipping cleaner, faster software with small teams.',
                'organizer' => 'Software Development Club',
                'location' => 'Main Hall',
                'starts_at' => $at(3, 10),
                'ends_at' => $at(3, 12),
                'capacity' => 100,
            ],
            [
                'title' => 'BSIT Career Fair',
                'description' => 'Meet hiring partners, review portfolios, and practise interview pitches.',
                'organizer' => 'College of Information Technology',
                'location' => 'Student Center',
                'starts_at' => $at(6, 9),
                'ends_at' => $at(6, 16),
                'capacity' => 150,
            ],
            [
                'title' => 'Web Development Workshop',
                'description' => 'Hands-on session building a small app with React and a REST API.',
                'organizer' => 'Computer Science Society',
                'location' => 'Computer Lab 1',
                'starts_at' => $at(14, 13),
                'ends_at' => $at(14, 16),
                'capacity' => 40,
            ],
            [
                'title' => 'Coding Bootcamp Orientation',
                'description' => 'What to expect from the eight-week bootcamp and how to prepare.',
                'organizer' => 'Computer Science Society',
                'location' => 'Auditorium',
                'starts_at' => $at(5, 8),
                'ends_at' => $at(5, 11),
                'capacity' => 80,
            ],
            [
                'title' => 'Intramurals Opening Ceremony',
                'description' => 'Parade of teams, torch lighting, and the first basketball game.',
                'organizer' => 'Sports Council',
                'location' => 'Gymnasium',
                'starts_at' => $at(9, 14),
                'ends_at' => $at(9, 17),
                'capacity' => 200,
            ],
            [
                'title' => 'AI in Education Forum',
                'description' => 'Faculty and students discuss where AI helps and where it gets in the way.',
                'organizer' => 'Research Office',
                'location' => 'Main Hall',
                'starts_at' => $at(11, 9),
                'ends_at' => $at(11, 12),
                'capacity' => 60,
            ],
            [
                'title' => 'Leadership Summit',
                'description' => 'Workshops for student organization officers and volunteers.',
                'organizer' => 'Student Affairs',
                'location' => 'Student Center',
                'starts_at' => $at(18, 10),
                'ends_at' => $at(18, 15),
                'capacity' => 120,
            ],
            [
                'title' => 'Film Screening Night',
                'description' => 'Student shorts followed by a talk with the filmmakers.',
                'organizer' => 'Arts Club',
                'location' => 'Auditorium',
                'starts_at' => $at(21, 18),
                'ends_at' => $at(21, 21),
                'capacity' => 90,
            ],
            [
                'title' => 'Freshman Welcome Assembly',
                'description' => 'Campus orientation and introduction of student services.',
                'organizer' => 'Student Affairs',
                'location' => 'Gymnasium',
                'starts_at' => $at(-21, 9),
                'ends_at' => $at(-21, 11),
                'capacity' => 200,
            ],
            [
                'title' => 'Robotics Meetup',
                'description' => 'Show and tell of student-built robots and a mini sumo match.',
                'organizer' => 'Robotics Club',
                'location' => 'Computer Lab 2',
                'starts_at' => $at(-14, 13),
                'ends_at' => $at(-14, 17),
                'capacity' => 50,
            ],
            [
                'title' => 'Research Colloquium',
                'description' => 'Undergraduate research presentations and panel feedback.',
                'organizer' => 'Research Office',
                'location' => 'Auditorium',
                'starts_at' => $at(-35, 8),
                'ends_at' => $at(-35, 12),
                'capacity' => 80,
            ],
        ])->map(fn (array $event) => Event::create($event));

        $students = User::query()->where('role', Role::Student->value)->get();

        foreach ($events as $event) {
            $maxAttendees = min($event->capacity, $students->count());
            $fillRatio = $event->starts_at->isPast()
                ? fake()->numberBetween(60, 95) / 100
                : fake()->numberBetween(20, 100) / 100;
            $fill = max(1, (int) round($maxAttendees * $fillRatio));

            foreach ($students->random($fill) as $student) {
                $registeredAt = $event->starts_at->copy()->subDays(fake()->numberBetween(1, 25));

                if ($registeredAt->isFuture()) {
                    $registeredAt = now()->subHours(fake()->numberBetween(1, 72));
                }

                $cancelled = fake()->boolean(18);

                Registration::create([
                    'user_id' => $student->id,
                    'event_id' => $event->id,
                    'status' => $cancelled ? RegistrationStatus::Cancelled : RegistrationStatus::Registered,
                    'full_name' => $student->name,
                    'student_id' => $student->student_id ?? '2023-00000',
                    'year_section' => $student->year_section,
                    'email' => $student->email,
                    'confirmed_attendance' => true,
                    'registered_at' => $registeredAt,
                    'cancelled_at' => $cancelled ? $registeredAt->copy()->addHours(fake()->numberBetween(2, 72)) : null,
                ]);
            }
        }

        $techTalk = $events->firstWhere('title', 'Tech Talk: Building Better Apps');

        Registration::updateOrCreate(
            ['user_id' => $demoStudent->id, 'event_id' => $techTalk->id],
            [
                'status' => RegistrationStatus::Registered,
                'full_name' => $demoStudent->name,
                'student_id' => $demoStudent->student_id,
                'year_section' => $demoStudent->year_section,
                'email' => $demoStudent->email,
                'confirmed_attendance' => true,
                'registered_at' => now()->subDays(2),
                'cancelled_at' => null,
            ],
        );
    }
}
