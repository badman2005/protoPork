<?php
/**
 * config.php - System Environment Configuration
 * protoPork Backend - ABCstartups / KachiCodes
 */

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'protopork');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Fixed pricing baseline: K95.00 per kg (9500 Ngwee)
define('PORK_BASE_PRICE_NGWEE', 9500);

// Delivery fee: K20.00 (2000 Ngwee)
define('DELIVERY_FEE_NGWEE', 2000);