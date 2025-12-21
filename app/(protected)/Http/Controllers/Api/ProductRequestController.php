<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductRequest;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProductRequestsExport;

class ProductRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ProductRequest::with(['createdBy']);

        // Search
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%")
                  ->orWhere('store_name', 'like', "%{$search}%")
                  ->orWhere('requested_by', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->get('priority'));
        }

        // Filter by store
        if ($request->has('store_name')) {
            $query->where('store_name', $request->get('store_name'));
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('request_date', [
                $request->get('start_date'),
                $request->get('end_date')
            ]);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'request_date');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $requests = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $requests,
            'message' => 'Product requests retrieved successfully'
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_name' => 'required|string|max:255',
            'quantity_requested' => 'required|integer|min:1',
            'request_date' => 'required|date',
            'store_name' => 'required|string|max:255',
            'unit_price' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'supplier_location' => 'nullable|string|max:255',
            'priority' => 'in:low,normal,high,urgent',
            'requested_by' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $productRequest = ProductRequest::create([
            'product_name' => $request->product_name,
            'quantity_requested' => $request->quantity_requested,
            'quantity_realized' => 0,
            'request_date' => $request->request_date,
            'store_name' => $request->store_name,
            'unit_price' => $request->unit_price ?? 0,
            'total_price' => ($request->quantity_requested * ($request->unit_price ?? 0)),
            'notes' => $request->notes,
            'supplier_location' => $request->supplier_location,
            'status' => 'pending',
            'priority' => $request->priority ?? 'normal',
            'requested_by' => $request->requested_by,
            'created_by' => auth()->id()
        ]);

        // Log the action
        AuditLog::log('create', 'product_requests', $productRequest->id, null, $productRequest->toArray());

        return response()->json([
            'success' => true,
            'data' => $productRequest,
            'message' => 'Product request created successfully'
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $productRequest = ProductRequest::with(['createdBy'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $productRequest,
            'message' => 'Product request retrieved successfully'
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $productRequest = ProductRequest::findOrFail($id);
        $oldValues = $productRequest->toArray();

        $validator = Validator::make($request->all(), [
            'product_name' => 'required|string|max:255',
            'quantity_requested' => 'required|integer|min:1',
            'quantity_realized' => 'nullable|integer|min:0',
            'request_date' => 'required|date',
            'realization_date' => 'nullable|date',
            'store_name' => 'required|string|max:255',
            'unit_price' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'supplier_location' => 'nullable|string|max:255',
            'status' => 'in:pending,partial,fulfilled,cancelled',
            'priority' => 'in:low,normal,high,urgent',
            'requested_by' => 'required|string|max:255',
            'approved_by' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $productRequest->update([
            'product_name' => $request->product_name,
            'quantity_requested' => $request->quantity_requested,
            'quantity_realized' => $request->quantity_realized ?? $productRequest->quantity_realized,
            'request_date' => $request->request_date,
            'realization_date' => $request->realization_date,
            'store_name' => $request->store_name,
            'unit_price' => $request->unit_price ?? 0,
            'total_price' => ($request->quantity_requested * ($request->unit_price ?? 0)),
            'notes' => $request->notes,
            'supplier_location' => $request->supplier_location,
            'status' => $request->status ?? $productRequest->status,
            'priority' => $request->priority ?? $productRequest->priority,
            'requested_by' => $request->requested_by,
            'approved_by' => $request->approved_by
        ]);

        // Log the action
        AuditLog::log('update', 'product_requests', $productRequest->id, $oldValues, $productRequest->toArray());

        return response()->json([
            'success' => true,
            'data' => $productRequest,
            'message' => 'Product request updated successfully'
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $productRequest = ProductRequest::findOrFail($id);
        $oldValues = $productRequest->toArray();

        $productRequest->delete();

        // Log the action
        AuditLog::log('delete', 'product_requests', $id, $oldValues, null);

        return response()->json([
            'success' => true,
            'message' => 'Product request deleted successfully'
        ]);
    }

    public function fulfill(Request $request, $id): JsonResponse
    {
        $productRequest = ProductRequest::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'quantity_realized' => 'required|integer|min:0|max:' . $productRequest->quantity_requested,
            'approved_by' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $productRequest->fulfill($request->quantity_realized, $request->approved_by);

        // Log the action
        AuditLog::log('update', 'product_requests', $productRequest->id, 
                     ['status' => 'pending'], 
                     ['status' => $productRequest->status, 'quantity_realized' => $request->quantity_realized]);

        return response()->json([
            'success' => true,
            'data' => $productRequest,
            'message' => 'Product request fulfilled successfully'
        ]);
    }

    public function export(Request $request)
    {
        $filters = $request->only(['search', 'status', 'priority', 'store_name', 'start_date', 'end_date']);
        
        return Excel::download(new ProductRequestsExport($filters), 'product_requests.xlsx');
    }

    public function report(Request $request): JsonResponse
    {
        $query = ProductRequest::query();

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('request_date', [
                $request->get('start_date'),
                $request->get('end_date')
            ]);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Filter by store
        if ($request->has('store_name')) {
            $query->where('store_name', $request->get('store_name'));
        }

        $requests = $query->orderBy('request_date', 'desc')->get();

        // Prepare report data
        $reportData = $requests->map(function ($request) {
            return [
                'product_name' => $request->product_name,
                'quantity_requested' => $request->quantity_requested,
                'quantity_realized' => $request->quantity_realized,
                'request_date' => $request->request_date->format('Y-m-d'),
                'realization_date' => $request->realization_date ? $request->realization_date->format('Y-m-d') : null,
                'store_name' => $request->store_name,
                'unit_price' => $request->unit_price,
                'total_price' => $request->total_price,
                'status' => $request->status,
                'priority' => $request->priority,
                'requested_by' => $request->requested_by,
                'approved_by' => $request->approved_by,
                'supplier_location' => $request->supplier_location,
                'fulfillment_percentage' => $request->fulfillment_percentage,
                'notes' => $request->notes
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $reportData,
            'summary' => [
                'total_requests' => $requests->count(),
                'pending_requests' => $requests->where('status', 'pending')->count(),
                'fulfilled_requests' => $requests->where('status', 'fulfilled')->count(),
                'partial_requests' => $requests->where('status', 'partial')->count(),
                'total_requested_quantity' => $requests->sum('quantity_requested'),
                'total_realized_quantity' => $requests->sum('quantity_realized'),
                'total_value' => $requests->sum('total_price')
            ],
            'message' => 'Product requests report generated successfully'
        ]);
    }
}
