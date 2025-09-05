<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OutgoingTransactionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'outgoing_transaction_id',
        'product_id',
        'quantity',
        'unit_price',
        'total_price',
        'destination',
        'notes'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function outgoingTransaction()
    {
        return $this->belongsTo(OutgoingTransaction::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Mutators
    public function setQuantityAttribute($value)
    {
        $this->attributes['quantity'] = $value;
        $this->calculateTotalPrice();
    }

    public function setUnitPriceAttribute($value)
    {
        $this->attributes['unit_price'] = $value;
        $this->calculateTotalPrice();
    }

    // Methods
    private function calculateTotalPrice()
    {
        if (isset($this->attributes['quantity']) && isset($this->attributes['unit_price'])) {
            $this->attributes['total_price'] = $this->attributes['quantity'] * $this->attributes['unit_price'];
        }
    }
}
