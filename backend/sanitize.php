<?php
/**
 * sanitize.php - Input Sanitization & Security Utility
 * protoPork Backend - ABCstartups / KachiCodes
 */

declare(strict_types=1);

class Sanitizer
{
    public static function string(?string $value, int $maxLength = 255): string
    {
        if ($value === null) return '';
        $clean = trim(preg_replace('/[\x00-\x1F\x7F]/u', '', $value));
        $clean = strip_tags($clean);
        $clean = htmlspecialchars($clean, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        return (mb_strlen($clean, 'UTF-8') > $maxLength) ? mb_substr($clean, 0, $maxLength, 'UTF-8') : $clean;
    }

    public static function phone(?string $value): string
    {
        if ($value === null) return '';
        $phone = preg_replace('/[^0-9+]/', '', trim($value));
        return self::string($phone, 20);
    }

    public static function int($value, int $min = 0, int $max = PHP_INT_MAX): int
    {
        $filtered = filter_var($value, FILTER_VALIDATE_INT);
        if ($filtered === false) return $min;
        return max($min, min($max, $filtered));
    }

    public static function float($value, float $min = 0.0, float $max = 50000.0, int $decimals = 3): float
    {
        $filtered = filter_var($value, FILTER_VALIDATE_FLOAT);
        if ($filtered === false) return $min;
        return round(max($min, min($max, $filtered)), $decimals);
    }

    public static function enum(?string $value, array $allowed, string $default): string
    {
        if ($value === null) return $default;
        $clean = strtolower(trim($value));
        return in_array($clean, $allowed, true) ? $clean : $default;
    }
}