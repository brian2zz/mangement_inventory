<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'card_number',
        'name',
        'category_id',
        'part_number',
        'description',
        'stock',
        'unit_price',
        'reorder_level',
        'supplier_id',
        'status'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'stock' => 'integer',
        'reorder_level' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class)->orderBy('created_at', 'desc');
    }

    public function incomingTransactionItems()
    {
        return $this->hasMany(IncomingTransactionItem::class);
    }

    public function outgoingTransactionItems()
    {
        return $this->hasMany(OutgoingTransactionItem::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeLowStock($query)
    {
        return $query->whereRaw('stock <= reorder_level');
    }

    public function scopeOutOfStock($query)
    {
        return $query->where('stock', 0);
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    // Accessors
    public function getStockStatusAttribute()
    {
        if ($this->stock == 0) {
            return 'out_of_stock';
        } elseif ($this->stock <= $this->reorder_level) {
            return 'low_stock';
        } else {
            return 'in_stock';
        }
    }

    public function getTotalValueAttribute()
    {
        return $this->stock * $this->unit_price;
    }

    // Methods
    public function updateStock($quantity, $type = 'adjustment', $referenceType = null, $referenceId = null, $notes = null)
    {
        $previousStock = $this->stock;
        
        if ($type === 'in') {
            $this->stock += $quantity;
        } elseif ($type === 'out') {
            $this->stock -= $quantity;
        } else {
            $this->stock = $quantity;
        }

        $this->save();

        // Create stock movement record
        StockMovement::create([
            'product_id' => $this->id,
            'movement_type' => $type,
            'quantity' => $quantity,
            'previous_stock' => $previousStock,
            'new_stock' => $this->stock,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'notes' => $notes,
            'created_by' => auth()->id()
        ]);

        return $this;
    }
}
