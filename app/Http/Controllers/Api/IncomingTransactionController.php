<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IncomingTransaction;
use App\Models\IncomingTransactionItem;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\IncomingTransactionsExport;

class IncomingTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = IncomingTransaction::with(['supplier', 'createdBy']);

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->whereHas('supplier', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })->orWhere('notes', 'like', "%{$search}%");
        }

        // Filter by supplier
        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->get('supplier_id'));
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('transaction_date', [
                $request->get('start_date'),
                $request->get('end_date')
            ]);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'transaction_date');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $transactions = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $transactions,
            'message' => 'Incoming transactions retrieved successfully'
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'in:draft,done',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Create transaction
            $transaction = IncomingTransaction::create([
                'supplier_id' => $request->supplier_id,
                'transaction_date' => $request->transaction_date,
                'notes' => $request->notes,
                'status' => $request->status ?? 'draft',
                'created_by' => auth()->id()
            ]);

            // Create transaction items
            foreach ($request->items as $itemData) {
                $item = IncomingTransactionItem::create([
                    'incoming_transaction_id' => $transaction->id,
                    'product_id' => $itemData['product_id'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $itemData['quantity'] * $itemData['unit_price'],
                    'notes' => $itemData['notes'] ?? null
                ]);

                // Update stock if transaction is done
                if ($transaction->status === 'done') {
                    $product = Product::find($itemData['product_id']);
                    $product->updateStock(
                        $itemData['quantity'],
                        'in',
                        'incoming_transaction',
                        $transaction->id,
                        "Incoming transaction #{$transaction->id}"
                    );
                }
            }

            // Calculate totals
            $transaction->calculateTotals();

            DB::commit();

            // Log the action
            AuditLog::log('create', 'incoming_transactions', $transaction->id, null, $transaction->toArray());

            return response()->json([
                'success' => true,
                'data' => $transaction->load(['supplier', 'items.product']),
                'message' => 'Incoming transaction created successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create transaction: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        $transaction = IncomingTransaction::with([
            'supplier',
            'items.product.category',
            'createdBy'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $transaction,
            'message' => 'Incoming transaction retrieved successfully'
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $transaction = IncomingTransaction::findOrFail($id);
        $oldValues = $transaction->toArray();

        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'in:draft,done',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:incoming_transaction_items,id',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $wasCompleted = $transaction->status === 'done';
            
            // Update transaction
            $transaction->update([
                'supplier_id' => $request->supplier_id,
                'transaction_date' => $request->transaction_date,
                'notes' => $request->notes,
                'status' => $request->status ?? 'draft'
            ]);

            // If transaction was completed, reverse stock changes
            if ($wasCompleted) {
                foreach ($transaction->items as $oldItem) {
                    $product = Product::find($oldItem->product_id);
                    $product->updateStock(
                        $oldItem->quantity,
                        'out',
                        'incoming_transaction_reversal',
                        $transaction->id,
                        "Reversal of incoming transaction #{$transaction->id} for editing"
                    );
                }
            }

            // Delete existing items
            $transaction->items()->delete();

            // Create new items
            foreach ($request->items as $itemData) {
                IncomingTransactionItem::create([
                    'incoming_transaction_id' => $transaction->id,
                    'product_id' => $itemData['product_id'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $itemData['quantity'] * $itemData['unit_price'],
                    'notes' => $itemData['notes'] ?? null
                ]);

                // Update stock if transaction is done
                if ($transaction->status === 'done') {
                    $product = Product::find($itemData['product_id']);
                    $product->updateStock(
                        $itemData['quantity'],
                        'in',
                        'incoming_transaction',
                        $transaction->id,
                        "Updated incoming transaction #{$transaction->id}"
                    );
                }
            }

            // Calculate totals
            $transaction->calculateTotals();

            DB::commit();

            // Log the action
            AuditLog::log('update', 'incoming_transactions', $transaction->id, $oldValues, $transaction->toArray());

            return response()->json([
                'success' => true,
                'data' => $transaction->load(['supplier', 'items.product']),
                'message' => 'Incoming transaction updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update transaction: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        $transaction = IncomingTransaction::findOrFail($id);
        $oldValues = $transaction->toArray();

        DB::beginTransaction();

        try {
            // If transaction was completed, reverse stock changes
            if ($transaction->status === 'done') {
                foreach ($transaction->items as $item) {
                    $product = Product::find($item->product_id);
                    $product->updateStock(
                        $item->quantity,
                        'out',
                        'incoming_transaction_deletion',
                        $transaction->id,
                        "Deletion of incoming transaction #{$transaction->id}"
                    );
                }
            }

            $transaction->delete();

            DB::commit();

            // Log the action
            AuditLog::log('delete', 'incoming_transactions', $id, $oldValues, null);

            return response()->json([
                'success' => true,
                'message' => 'Incoming transaction deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete transaction: ' . $e->getMessage()
            ], 500);
        }
    }

    public function markAsDone($id): JsonResponse
    {
        $transaction = IncomingTransaction::findOrFail($id);

        if ($transaction->status === 'done') {
            return response()->json([
                'success' => false,
                'message' => 'Transaction is already marked as done'
            ], 422);
        }

        DB::beginTransaction();

        try {
            $transaction->markAsDone();

            DB::commit();

            // Log the action
            AuditLog::log('update', 'incoming_transactions', $transaction->id, ['status' => 'draft'], ['status' => 'done']);

            return response()->json([
                'success' => true,
                'data' => $transaction->load(['supplier', 'items.product']),
                'message' => 'Transaction marked as done successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark transaction as done: ' . $e->getMessage()
            ], 500);
        }
    }

    public function export(Request $request)
    {
        $filters = $request->only(['search', 'supplier_id', 'status', 'start_date', 'end_date']);
        
        return Excel::download(new IncomingTransactionsExport($filters), 'incoming_transactions.xlsx');
    }

    public function report(Request $request): JsonResponse
    {
        $query = IncomingTransaction::with(['supplier', 'items.product.category'])
                                  ->where('status', 'done');

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('transaction_date', [
                $request->get('start_date'),
                $request->get('end_date')
            ]);
        }

        // Filter by supplier
        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->get('supplier_id'));
        }

        $transactions = $query->orderBy('transaction_date', 'desc')->get();

        // Prepare report data
        $reportData = [];
        foreach ($transactions as $transaction) {
            foreach ($transaction->items as $item) {
                $reportData[] = [
                    'date' => $transaction->transaction_date->format('Y-m-d'),
                    'product_name' => $item->product->name,
                    'category' => $item->product->category->name,
                    'part_number' => $item->product->part_number,
                    'supplier' => $transaction->supplier->name,
                    'quantity_in' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total_price' => $item->total_price,
                    'current_stock' => $item->product->stock,
                    'remarks' => $item->notes
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => $reportData,
            'summary' => [
                'total_transactions' => $transactions->count(),
                'total_items' => collect($reportData)->sum('quantity_in'),
                'total_value' => collect($reportData)->sum('total_price')
            ],
            'message' => 'Incoming products report generated successfully'
        ]);
    }
}
