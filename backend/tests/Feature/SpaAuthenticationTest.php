<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Tests\TestCase;

class SpaAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_frontend_is_trusted_and_unrelated_origins_are_not(): void
    {
        $request = Request::create('/api/user');
        $request->headers->set('Origin', 'http://localhost:5173');
        $this->assertTrue(EnsureFrontendRequestsAreStateful::fromFrontend($request));
        $request->headers->set('Origin', 'https://untrusted.example');
        $this->assertFalse(EnsureFrontendRequestsAreStateful::fromFrontend($request));
    }

    public function test_login_session_authenticates_api_and_logout_revokes_it(): void
    {
        $user = User::factory()->create(['password' => 'test-password']);
        $this->withHeader('Origin', 'http://localhost:5173');
        $this->postJson('/login', ['email' => $user->email, 'password' => 'test-password'])
            ->assertOk()->assertJsonPath('user.id', $user->id);
        $this->getJson('/api/user')->assertOk()->assertJsonPath('id', $user->id);
        $this->postJson('/logout')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_registration_creates_an_authenticated_session(): void
    {
        $this->withHeader('Origin', 'http://localhost:5173');
        $response = $this->postJson('/register', [
            'name' => 'SPA User', 'email' => 'spa@example.test',
            'password' => 'test-password', 'password_confirmation' => 'test-password',
        ])->assertCreated();
        $this->getJson('/api/user')->assertOk()->assertJsonPath('id', $response->json('user.id'));
    }
}
