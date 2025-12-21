<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    // Scopes
    public function scopeWithProductCount($query)
    {
        return $query->withCount('products');
    }

    // Accessors
    public function getProductCountAttribute()
    {
        return $this->products()->count();
    }
}
