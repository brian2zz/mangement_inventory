<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Supplier;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProductsExport;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'supplier']);

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('card_number', 'like', "%{$search}%")
                  ->orWhere('part_number', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Filter by stock status
        if ($request->has('stock_status')) {
            $stockStatus = $request->get('stock_status');
            if ($stockStatus === 'low_stock') {
                $query->whereRaw('stock <= reorder_level');
            } elseif ($stockStatus === 'out_of_stock') {
                $query->where('stock', 0);
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products,
            'message' => 'Products retrieved successfully'
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'card_number' => 'required|string|unique:products,card_number',
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:product_categories,id',
            'part_number' => 'required|string|max:100',
            'description' => 'nullable|string',
            'stock' => 'required|integer|min:0',
            'unit_price' => 'nullable|numeric|min:0',
            'reorder_level' => 'nullable|integer|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'status' => 'in:active,inactive,discontinued'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $product = Product::create($request->all());

        // Log the action
        AuditLog::log('create', 'products', $product->id, null, $product->toArray());

        return response()->json([
            'success' => true,
            'data' => $product->load(['category', 'supplier']),
            'message' => 'Product created successfully'
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $product = Product::with(['category', 'supplier', 'stockMovements.createdBy'])
                          ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
            'message' => 'Product retrieved successfully'
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $oldValues = $product->toArray();

        $validator = Validator::make($request->all(), [
            'card_number' => 'required|string|unique:products,card_number,' . $id,
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:product_categories,id',
            'part_number' => 'required|string|max:100',
            'description' => 'nullable|string',
            'stock' => 'required|integer|min:0',
            'unit_price' => 'nullable|numeric|min:0',
            'reorder_level' => 'nullable|integer|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'status' => 'in:active,inactive,discontinued'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle stock changes
        if ($request->has('stock') && $request->stock != $product->stock) {
            $product->updateStock(
                $request->stock,
                'adjustment',
                null,
                null,
                'Manual stock adjustment'
            );
        }

        $product->update($request->except('stock'));

        // Log the action
        AuditLog::log('update', 'products', $product->id, $oldValues, $product->toArray());

        return response()->json([
            'success' => true,
            'data' => $product->load(['category', 'supplier']),
            'message' => 'Product updated successfully'
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $oldValues = $product->toArray();

        // Check if product has transactions
        if ($product->incomingTransactionItems()->exists() || $product->outgoingTransactionItems()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete product with existing transactions'
            ], 422);
        }

        $product->delete();

        // Log the action
        AuditLog::log('delete', 'products', $id, $oldValues, null);

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    }

    public function export(Request $request)
    {
        $filters = $request->only(['search', 'category_id', 'status', 'stock_status']);
        
        return Excel::download(new ProductsExport($filters), 'products.xlsx');
    }

    public function lowStock(): JsonResponse
    {
        $products = Product::with(['category', 'supplier'])
                          ->lowStock()
                          ->orderBy('stock', 'asc')
                          ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
            'message' => 'Low stock products retrieved successfully'
        ]);
    }

    public function stockMovements($id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $movements = $product->stockMovements()
                            ->with('createdBy')
                            ->orderBy('created_at', 'desc')
                            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $movements,
            'message' => 'Stock movements retrieved successfully'
        ]);
    }
}
