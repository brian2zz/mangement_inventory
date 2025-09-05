<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'role',
        'password',
        'status'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function createdProducts()
    {
        return $this->hasMany(Product::class, 'created_by');
    }

    public function createdIncomingTransactions()
    {
        return $this->hasMany(IncomingTransaction::class, 'created_by');
    }

    public function createdOutgoingTransactions()
    {
        return $this->hasMany(OutgoingTransaction::class, 'created_by');
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class, 'created_by');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    // Accessors & Mutators
    public function setPasswordAttribute($password)
    {
        $this->attributes['password'] = bcrypt($password);
    }

    // Helper methods
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isStaff()
    {
        return $this->role === 'staff';
    }

    public function isViewer()
    {
        return $this->role === 'viewer';
    }

    public function hasPermission($permission)
    {
        $permissions = [
            'admin' => ['create', 'read', 'update', 'delete', 'manage_users'],
            'staff' => ['create', 'read', 'update'],
            'viewer' => ['read']
        ];

        return in_array($permission, $permissions[$this->role] ?? []);
    }
}
