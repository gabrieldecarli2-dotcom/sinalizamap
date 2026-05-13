<?php

function telegram_alerts_enabled(array $config): bool
{
    return !empty($config['telegram_alertas_ativos'])
        && !empty($config['telegram_bot_token'])
        && !empty($config['telegram_chat_id']);
}

function telegram_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function telegram_line(string $label, ?string $value): string
{
    $cleanValue = trim((string) $value);

    if ($cleanValue === '') {
        return '';
    }

    return '<b>' . telegram_escape($label) . ':</b> ' . telegram_escape($cleanValue);
}

function telegram_post(string $token, array $payload): bool
{
    $url = 'https://api.telegram.org/bot' . $token . '/sendMessage';
    $body = http_build_query($payload);

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        ]);

        $response = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        return $response !== false && $status >= 200 && $status < 300;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $body,
            'timeout' => 8,
        ],
    ]);

    return file_get_contents($url, false, $context) !== false;
}

function notify_telegram_irregularidade(array $sinalizacao): void
{
    $config = sinalizamap_config();

    if (!telegram_alerts_enabled($config)) {
        return;
    }

    $lines = [
        '<b>Nova irregularidade registrada pela GCM</b>',
        '',
        telegram_line('Tipo', $sinalizacao['tipo_nome'] ?? ''),
        telegram_line('Endereço', $sinalizacao['endereco'] ?? ''),
        telegram_line('Observação', $sinalizacao['observacoes'] ?? ''),
        telegram_line('Patrimônio', $sinalizacao['patrimonio'] ?? ''),
        telegram_line('Registrado por', $sinalizacao['criado_por'] ?? ''),
        telegram_line('Protocolo', $sinalizacao['$id'] ?? ''),
        telegram_line(
            'Coordenadas',
            isset($sinalizacao['latitude'], $sinalizacao['longitude'])
                ? $sinalizacao['latitude'] . ', ' . $sinalizacao['longitude']
                : ''
        ),
    ];

    if (!empty($config['app_url'])) {
        $lines[] = '';
        $lines[] = '<a href="' . telegram_escape(rtrim($config['app_url'], '/') . '/irregularidades') . '">Abrir SinalizaMap</a>';
    }

    $message = implode("\n", array_values(array_filter($lines, function ($line) {
        return $line !== '';
    })));

    telegram_post($config['telegram_bot_token'], [
        'chat_id' => $config['telegram_chat_id'],
        'text' => $message,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => true,
    ]);
}
