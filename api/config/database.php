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
        'db_socket' => getenv('SINALIZAMAP_DB_SOCKET') ?: '',
        'app_secret' => getenv('SINALIZAMAP_APP_SECRET') ?: 'troque-esta-chave-no-cpanel',
        'app_url' => getenv('SINALIZAMAP_APP_URL') ?: '',
        'telegram_alertas_ativos' => getenv('SINALIZAMAP_TELEGRAM_ALERTAS_ATIVOS') ?: false,
        'telegram_bot_token' => getenv('SINALIZAMAP_TELEGRAM_BOT_TOKEN') ?: '',
        'telegram_chat_id' => getenv('SINALIZAMAP_TELEGRAM_CHAT_ID') ?: '',
    ], is_array($localConfig) ? $localConfig : []);
}

function sinalizamap_pdo(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = sinalizamap_config();
    $dsn = $config['db_socket']
        ? sprintf(
            'mysql:unix_socket=%s;dbname=%s;charset=%s',
            $config['db_socket'],
            $config['db_name'],
            $config['db_charset']
        )
        : sprintf(
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
