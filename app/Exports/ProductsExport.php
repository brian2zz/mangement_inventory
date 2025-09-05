<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductsExport implements FromQuery, WithHeadings, WithMapping, WithStyles
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function query()
    {
        $query = Product::with(['category', 'supplier']);

        // Apply filters
        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('card_number', 'like', "%{$search}%")
                  ->orWhere('part_number', 'like', "%{$search}%");
            });
        }

        if (!empty($this->filters['category_id'])) {
            $query->where('category_id', $this->filters['category_id']);
        }

        if (!empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (!empty($this->filters['stock_status'])) {
            $stockStatus = $this->filters['stock_status'];
            if ($stockStatus === 'low_stock') {
                $query->whereRaw('stock <= reorder_level');
            } elseif ($stockStatus === 'out_of_stock') {
                $query->where('stock', 0);
            }
        }

        return $query->orderBy('name');
    }

    public function headings(): array
    {
        return [
            'Card Number',
            'Product Name',
            'Category',
            'Part Number',
            'Description',
            'Current Stock',
            'Unit Price',
            'Reorder Level',
            'Supplier',
            'Status',
            'Total Value',
            'Stock Status'
        ];
    }

    public function map($product): array
    {
        return [
            $product->card_number,
            $product->name,
            $product->category->name ?? '',
            $product->part_number,
            $product->description,
            $product->stock,
            $product->unit_price,
            $product->reorder_level,
            $product->supplier->name ?? '',
            ucfirst($product->status),
            $product->total_value,
            ucfirst(str_replace('_', ' ', $product->stock_status))
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => 'solid', 'color' => ['rgb' => 'FF8FAB']]],
        ];
    }
}
