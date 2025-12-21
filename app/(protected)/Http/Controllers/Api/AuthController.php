<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'remember_me' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');
        
        if (!Auth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::user();
        
        if ($user->status !== 'active') {
            Auth::logout();
            return response()->json([
                'success' => false,
                'message' => 'Account is inactive'
            ], 401);
        }

        // Update last login
        $user->update(['last_login' => now()]);

        // Create token
        $tokenName = $request->remember_me ? 'remember_token' : 'access_token';
        $expiresAt = $request->remember_me ? now()->addDays(30) : now()->addHours(8);
        
        $token = $user->createToken($tokenName, ['*'], $expiresAt)->plainTextToken;

        // Log the action
        AuditLog::log('login', 'users', $user->id, null, ['login_time' => now()]);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'role' => $user->role,
                    'status' => $user->status,
                    'last_login' => $user->last_login
                ],
                'token' => $token,
                'expires_at' => $expiresAt->toISOString()
            ],
            'message' => 'Login successful'
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        // Log the action
        AuditLog::log('logout', 'users', $user->id, null, ['logout_time' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Logout successful'
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'role' => $user->role,
                'status' => $user->status,
                'last_login' => $user->last_login,
                'permissions' => $this->getUserPermissions($user->role)
            ],
            'message' => 'User profile retrieved successfully'
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        // Log the action
        AuditLog::log('update', 'users', $user->id, null, ['action' => 'password_changed']);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $oldValues = $user->only(['name', 'phone', 'address']);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($request->only(['name', 'phone', 'address']));

        // Log the action
        AuditLog::log('update', 'users', $user->id, $oldValues, $user->only(['name', 'phone', 'address']));

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'role' => $user->role,
                'status' => $user->status
            ],
            'message' => 'Profile updated successfully'
        ]);
    }

    private function getUserPermissions($role): array
    {
        $permissions = [
            'admin' => ['create', 'read', 'update', 'delete', 'manage_users', 'view_reports', 'export_data'],
            'staff' => ['create', 'read', 'update', 'view_reports', 'export_data'],
            'viewer' => ['read', 'view_reports']
        ];

        return $permissions[$role] ?? [];
    }
}
