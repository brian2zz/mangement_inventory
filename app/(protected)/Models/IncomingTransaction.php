<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IncomingTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'transaction_date',
        'notes',
        'status',
        'total_items',
        'total_value',
        'created_by'
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'total_value' => 'decimal:2',
        'total_items' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(IncomingTransactionItem::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeDone($query)
    {
        return $query->where('status', 'done');
    }

    public function scopeBySupplier($query, $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    // Methods
    public function calculateTotals()
    {
        $this->total_items = $this->items()->sum('quantity');
        $this->total_value = $this->items()->sum('total_price');
        $this->save();

        return $this;
    }

    public function markAsDone()
    {
        if ($this->status === 'draft') {
            $this->status = 'done';
            $this->save();

            // Update product stocks
            foreach ($this->items as $item) {
                $item->product->updateStock(
                    $item->quantity,
                    'in',
                    'incoming_transaction',
                    $this->id,
                    "Incoming transaction #{$this->id}"
                );
            }
        }

        return $this;
    }
}
