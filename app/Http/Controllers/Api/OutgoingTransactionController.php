<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OutgoingTransaction;
use App\Models\OutgoingTransactionItem;
use App\Models\Product;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\OutgoingTransactionsExport;

class OutgoingTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = OutgoingTransaction::with(['createdBy']);

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('source_location', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Filter by source
        if ($request->has('source_location')) {
            $query->where('source_location', $request->get('source_location'));
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
            'message' => 'Outgoing transactions retrieved successfully'
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'source_location' => 'required|string|max:255',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'in:draft,done',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.destination' => 'required|string|max:255',
            'items.*.notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validate stock availability
        foreach ($request->items as $itemData) {
            $product = Product::find($itemData['product_id']);
            if ($product->stock < $itemData['quantity']) {
                return response()->json([
                    'success' => false,
                    'message' => "Insufficient stock for {$product->name}. Available: {$product->stock}, Requested: {$itemData['quantity']}"
                ], 422);
            }
        }

        DB::beginTransaction();

        try {
            // Create transaction
            $transaction = OutgoingTransaction::create([
                'source_location' => $request->source_location,
                'transaction_date' => $request->transaction_date,
                'notes' => $request->notes,
                'status' => $request->status ?? 'draft',
                'created_by' => auth()->id()
            ]);

            // Create transaction items
            foreach ($request->items as $itemData) {
                OutgoingTransactionItem::create([
                    'outgoing_transaction_id' => $transaction->id,
                    'product_id' => $itemData['product_id'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $itemData['quantity'] * $itemData['unit_price'],
                    'destination' => $itemData['destination'],
                    'notes' => $itemData['notes'] ?? null
                ]);

                // Update stock if transaction is done
                if ($transaction->status === 'done') {
                    $product = Product::find($itemData['product_id']);
                    $product->updateStock(
                        $itemData['quantity'],
                        'out',
                        'outgoing_transaction',
                        $transaction->id,
                        "Outgoing transaction #{$transaction->id} to {$itemData['destination']}"
                    );
                }
            }

            // Calculate totals
            $transaction->calculateTotals();

            DB::commit();

            // Log the action
            AuditLog::log('create', 'outgoing_transactions', $transaction->id, null, $transaction->toArray());

            return response()->json([
                'success' => true,
                'data' => $transaction->load(['items.product']),
                'message' => 'Outgoing transaction created successfully'
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
        $transaction = OutgoingTransaction::with([
            'items.product.category',
            'createdBy'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $transaction,
            'message' => 'Outgoing transaction retrieved successfully'
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $transaction = OutgoingTransaction::findOrFail($id);
        $oldValues = $transaction->toArray();

        $validator = Validator::make($request->all(), [
            'source_location' => 'required|string|max:255',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'in:draft,done',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.destination' => 'required|string|max:255',
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
                'source_location' => $request->source_location,
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
                        'in',
                        'outgoing_transaction_reversal',
                        $transaction->id,
                        "Reversal of outgoing transaction #{$transaction->id} for editing"
                    );
                }
            }

            // Validate stock availability for new items
            foreach ($request->items as $itemData) {
                $product = Product::find($itemData['product_id']);
                $availableStock = $product->stock;
                
                if ($transaction->status === 'done' && $availableStock < $itemData['quantity']) {
                    throw new \Exception("Insufficient stock for {$product->name}. Available: {$availableStock}, Requested: {$itemData['quantity']}");
                }
            }

            // Delete existing items
            $transaction->items()->delete();

            // Create new items
            foreach ($request->items as $itemData) {
                OutgoingTransactionItem::create([
                    'outgoing_transaction_id' => $transaction->id,
                    'product_id' => $itemData['product_id'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $itemData['quantity'] * $itemData['unit_price'],
                    'destination' => $itemData['destination'],
                    'notes' => $itemData['notes'] ?? null
                ]);

                // Update stock if transaction is done
                if ($transaction->status === 'done') {
                    $product = Product::find($itemData['product_id']);
                    $product->updateStock(
                        $itemData['quantity'],
                        'out',
                        'outgoing_transaction',
                        $transaction->id,
                        "Updated outgoing transaction #{$transaction->id} to {$itemData['destination']}"
                    );
                }
            }

            // Calculate totals
            $transaction->calculateTotals();

            DB::commit();

            // Log the action
            AuditLog::log('update', 'outgoing_transactions', $transaction->id, $oldValues, $transaction->toArray());

            return response()->json([
                'success' => true,
                'data' => $transaction->load(['items.product']),
                'message' => 'Outgoing transaction updated successfully'
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
        $transaction = OutgoingTransaction::findOrFail($id);
        $oldValues = $transaction->toArray();

        DB::beginTransaction();

        try {
            // If transaction was completed, reverse stock changes
            if ($transaction->status === 'done') {
                foreach ($transaction->items as $item) {
                    $product = Product::find($item->product_id);
                    $product->updateStock(
                        $item->quantity,
                        'in',
                        'outgoing_transaction_deletion',
                        $transaction->id,
                        "Deletion of outgoing transaction #{$transaction->id}"
                    );
                }
            }

            $transaction->delete();

            DB::commit();

            // Log the action
            AuditLog::log('delete', 'outgoing_transactions', $id, $oldValues, null);

            return response()->json([
                'success' => true,
                'message' => 'Outgoing transaction deleted successfully'
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
        $transaction = OutgoingTransaction::findOrFail($id);

        if ($transaction->status === 'done') {
            return response()->json([
                'success' => false,
                'message' => 'Transaction is already marked as done'
            ], 422);
        }

        // Validate stock availability
        foreach ($transaction->items as $item) {
            if ($item->product->stock < $item->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => "Insufficient stock for {$item->product->name}. Available: {$item->product->stock}, Required: {$item->quantity}"
                ], 422);
            }
        }

        DB::beginTransaction();

        try {
            $transaction->markAsDone();

            DB::commit();

            // Log the action
            AuditLog::log('update', 'outgoing_transactions', $transaction->id, ['status' => 'draft'], ['status' => 'done']);

            return response()->json([
                'success' => true,
                'data' => $transaction->load(['items.product']),
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
        $filters = $request->only(['search', 'source_location', 'status', 'start_date', 'end_date']);
        
        return Excel::download(new OutgoingTransactionsExport($filters), 'outgoing_transactions.xlsx');
    }

    public function report(Request $request): JsonResponse
    {
        $query = OutgoingTransaction::with(['items.product.category'])
                                  ->where('status', 'done');

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('transaction_date', [
                $request->get('start_date'),
                $request->get('end_date')
            ]);
        }

        // Filter by source
        if ($request->has('source_location')) {
            $query->where('source_location', $request->get('source_location'));
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
                    'source' => $transaction->source_location,
                    'destination' => $item->destination,
                    'quantity_out' => $item->quantity,
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
                'total_items' => collect($reportData)->sum('quantity_out'),
                'total_value' => collect($reportData)->sum('total_price')
            ],
            'message' => 'Outgoing products report generated successfully'
        ]);
    }
}
