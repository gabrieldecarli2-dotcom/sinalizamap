<?php

function sinalizamap_config(): array
{
    $localConfigPath = __DIR__ . '/local.php';
    $localConfig = file_exists($localConfigPath) ? require $localConfigPath : [];

    return array_merge([
        'db_host' => getenv('SINALIZAMAP_DB_HOST') ?: 'localhost',
        'db_name' => getenv('SINALIZAMAP_DB_NAME') ?: 'sinalizamap',
        'db_user' => getenv('SINALIZAMAP_DB_USER') ?: 'root',
        'db_pass' => getenv('SINALIZAMAP_DB_PASS') ?: '',
        'db_charset' => getenv('SINALIZAMAP_DB_CHARSET') ?: 'utf8mb4',
    ], is_array($localConfig) ? $localConfig : []);
}

function sinalizamap_pdo(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = sinalizamap_config();
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $config['db_host'],
        $config['db_name'],
        $config['db_charset']
    );

    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
