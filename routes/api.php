<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductCategoryController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\IncomingTransactionController;
use App\Http\Controllers\Api\OutgoingTransactionController;
use App\Http\Controllers\Api\ProductRequestController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Products
    Route::apiResource('products', ProductController::class);
    Route::get('/products/{id}/stock-movements', [ProductController::class, 'stockMovements']);
    Route::get('/products-export', [ProductController::class, 'export']);
    Route::get('/products-low-stock', [ProductController::class, 'lowStock']);

    // Product Categories
    Route::apiResource('product-categories', ProductCategoryController::class);
    Route::get('/product-categories-export', [ProductCategoryController::class, 'export']);

    // Suppliers
    Route::apiResource('suppliers', SupplierController::class);
    Route::get('/suppliers-export', [SupplierController::class, 'export']);

    // Customers
    Route::apiResource('customers', CustomerController::class);
    Route::get('/customers-export', [CustomerController::class, 'export']);

    // Users (Admin only)
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::get('/users-export', [UserController::class, 'export']);
    });

    // Incoming Transactions
    Route::apiResource('incoming-transactions', IncomingTransactionController::class);
    Route::post('/incoming-transactions/{id}/mark-as-done', [IncomingTransactionController::class, 'markAsDone']);
    Route::get('/incoming-transactions-export', [IncomingTransactionController::class, 'export']);
    Route::get('/incoming-transactions-report', [IncomingTransactionController::class, 'report']);

    // Outgoing Transactions
    Route::apiResource('outgoing-transactions', OutgoingTransactionController::class);
    Route::post('/outgoing-transactions/{id}/mark-as-done', [OutgoingTransactionController::class, 'markAsDone']);
    Route::get('/outgoing-transactions-export', [OutgoingTransactionController::class, 'export']);
    Route::get('/outgoing-transactions-report', [OutgoingTransactionController::class, 'report']);

    // Product Requests
    Route::apiResource('product-requests', ProductRequestController::class);
    Route::post('/product-requests/{id}/fulfill', [ProductRequestController::class, 'fulfill']);
    Route::get('/product-requests-export', [ProductRequestController::class, 'export']);
    Route::get('/product-requests-report', [ProductRequestController::class, 'report']);

    // Reports
    Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/reports/inventory-summary', [ReportController::class, 'inventorySummary']);
    Route::get('/reports/stock-movements', [ReportController::class, 'stockMovements']);
    Route::get('/reports/low-stock-alert', [ReportController::class, 'lowStockAlert']);
});
