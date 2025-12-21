<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_name',
        'quantity_requested',
        'quantity_realized',
        'request_date',
        'realization_date',
        'store_name',
        'unit_price',
        'total_price',
        'notes',
        'supplier_location',
        'status',
        'priority',
        'requested_by',
        'approved_by',
        'created_by'
    ];

    protected $casts = [
        'quantity_requested' => 'integer',
        'quantity_realized' => 'integer',
        'request_date' => 'date',
        'realization_date' => 'date',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeFulfilled($query)
    {
        return $query->where('status', 'fulfilled');
    }

    public function scopePartial($query)
    {
        return $query->where('status', 'partial');
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeByStore($query, $store)
    {
        return $query->where('store_name', $store);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('request_date', [$startDate, $endDate]);
    }

    // Mutators
    public function setQuantityRequestedAttribute($value)
    {
        $this->attributes['quantity_requested'] = $value;
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
        if (isset($this->attributes['quantity_requested']) && isset($this->attributes['unit_price'])) {
            $this->attributes['total_price'] = $this->attributes['quantity_requested'] * $this->attributes['unit_price'];
        }
    }

    public function fulfill($quantity, $approvedBy = null)
    {
        $this->quantity_realized = $quantity;
        $this->realization_date = now()->toDateString();
        $this->approved_by = $approvedBy;
        
        if ($quantity >= $this->quantity_requested) {
            $this->status = 'fulfilled';
        } elseif ($quantity > 0) {
            $this->status = 'partial';
        }

        $this->save();

        return $this;
    }

    // Accessors
    public function getFulfillmentPercentageAttribute()
    {
        if ($this->quantity_requested == 0) {
            return 0;
        }

        return round(($this->quantity_realized / $this->quantity_requested) * 100, 2);
    }

    public function getRemainingQuantityAttribute()
    {
        return $this->quantity_requested - $this->quantity_realized;
    }
}
