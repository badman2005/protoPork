<?php
/**
 * api_order.php - Core Order Processing & FEFO Engine Endpoint
 * protoPork Backend - ABCstartups / KachiCodes
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/sanitize.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$rawInput = json_decode(file_get_contents('php://input'), true) ?? [];

// Sanitize Inputs
$clientId      = Sanitizer::int($rawInput['client_id'] ?? 0, 1);
$fulfillment   = Sanitizer::enum($rawInput['fulfillment'] ?? '', ['deliver', 'collect'], 'deliver');
$paymentMethod = Sanitizer::enum($rawInput['payment_method'] ?? '', ['momo', 'cash'], 'momo');
$nsp           = Sanitizer::enum($rawInput['nsp'] ?? '', ['mtn', 'airtel', 'zamtel', 'mastercard'], 'mtn');
$billingNumber = Sanitizer::phone($rawInput['billing_number'] ?? '');
$phone         = Sanitizer::phone($rawInput['phone'] ?? '');
$location      = Sanitizer::string($rawInput['location'] ?? '', 255);

$rawItems   = is_array($rawInput['items'] ?? null) ? $rawInput['items'] : [];
$cleanItems = [];

foreach ($rawItems as $item) {
    $cleanItems[] = [
        'product_id' => Sanitizer::int($item['product_id'] ?? 0, 1),
        'weight_kg'  => Sanitizer::float($item['weight_kg'] ?? 0, 0.001, 50.0, 3)
    ];
}

if ($clientId <= 0 || empty($cleanItems)) {
    http_response_code(422);
    echo json_encode(["error" => "Client ID and at least one item required."]);
    exit;
}

try {
    $pdo->beginTransaction();

    $deliveryFee = ($fulfillment === 'deliver') ? DELIVERY_FEE_NGWEE : 0;
    $totalAmount = $deliveryFee;
    $processedItems = [];

    foreach ($cleanItems as $item) {
        $productId = $item['product_id'];
        $requestedGrams = intval(round($item['weight_kg'] * 1000));
        
        $unitPrice = PORK_BASE_PRICE_NGWEE;
        $lineTotal = intval(round(($requestedGrams * $unitPrice) / 1000));
        $totalAmount += $lineTotal;

        // Select active batches expiring soonest (FEFO)
        $stmt = $pdo->prepare("
            SELECT id, available_qty 
            FROM batches 
            WHERE product_id = ? AND available_qty > 0 AND expiry_date >= CURDATE() 
            ORDER BY expiry_date ASC, id ASC
        ");
        $stmt->execute([$productId]);
        $batches = $stmt->fetchAll();

        $totalAvailable = array_sum(array_column($batches, 'available_qty'));
        if ($totalAvailable < $requestedGrams) {
            throw new Exception("Insufficient stock for product ID {$productId}.");
        }

        $rem = $requestedGrams;
        $allocations = [];

        foreach ($batches as $b) {
            if ($rem <= 0) break;
            $take = min($rem, $b['available_qty']);

            $upd = $pdo->prepare("UPDATE batches SET available_qty = available_qty - ? WHERE id = ?");
            $upd->execute([$take, $b['id']]);

            $allocations[] = ['batch_id' => $b['id'], 'qty' => $take];
            $rem -= $take;
        }

        $processedItems[] = [
            'product_id' => $productId,
            'unit_price' => $unitPrice,
            'estimated_weight' => $requestedGrams,
            'line_total' => $lineTotal,
            'allocations' => $allocations
        ];
    }

    // Insert Order Record
    $stmtOrder = $pdo->prepare("
        INSERT INTO orders (client_id, status, total_amount, fulfillment_type, delivery_fee, payment_method, nsp, billing_number, phone, location)
        VALUES (?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmtOrder->execute([$clientId, $totalAmount, $fulfillment, $deliveryFee, $paymentMethod, $nsp, $billingNumber, $phone, $location]);
    $orderId = $pdo->lastInsertId();

    // Insert Order Items and Allocations
    foreach ($processedItems as $pi) {
        $stmtItem = $pdo->prepare("
            INSERT INTO order_items (order_id, product_id, unit_price, estimated_weight, line_total)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmtItem->execute([$orderId, $pi['product_id'], $pi['unit_price'], $pi['estimated_weight'], $pi['line_total']]);
        $itemId = $pdo->lastInsertId();

        foreach ($pi['allocations'] as $alloc) {
            $stmtAlloc = $pdo->prepare("
                INSERT INTO order_batch_allocations (order_item_id, batch_id, allocated_qty)
                VALUES (?, ?, ?)
            ");
            $stmtAlloc->execute([$itemId, $alloc['batch_id'], $alloc['qty']]);
        }
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Order #{$orderId} placed successfully.",
        "order_id" => (int)$orderId,
        "total_amount" => $totalAmount,
        "gateway_status" => ($paymentMethod === 'momo') ? "USSD Push Prompt Sent" : "Cash Pending"
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}