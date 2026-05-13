<?php

require __DIR__ . '/config/database.php';
require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/telegram.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $resource = $_GET['resource'] ?? '';

    if ($resource === 'health') {
        json_response([
            'ok' => true,
            'php_version' => PHP_VERSION,
        ]);
    }

    if ($resource === 'auth') {
        handle_auth();
    }

    if ($resource === 'usuarios') {
        handle_usuarios();
    }

    if ($resource === 'sinalizacoes') {
        handle_sinalizacoes();
    }

    error_response('Recurso não encontrado.', 404);
} catch (PDOException $exception) {
    error_response('Erro de banco de dados: ' . $exception->getMessage(), 500);
} catch (Throwable $exception) {
    error_response('Erro inesperado: ' . $exception->getMessage(), 500);
}

function handle_sinalizacoes(): void
{
    $method = $_SERVER['REQUEST_METHOD'];
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? null;

    if ($method === 'GET' && $id && $action === 'historico') {
        list_historico_sinalizacao($id);
    }

    if ($method === 'GET' && $id) {
        get_sinalizacao($id);
    }

    if ($method === 'GET') {
        list_sinalizacoes();
    }

    if ($method === 'POST') {
        create_sinalizacao();
    }

    if ($method === 'PATCH' && $id && $action === 'resolve') {
        resolve_sinalizacao($id);
    }

    if ($method === 'PATCH' && $id) {
        update_sinalizacao($id);
    }

    if ($method === 'DELETE' && $id) {
        delete_sinalizacao($id);
    }

    error_response('Método não permitido.', 405);
}

function handle_auth(): void
{
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    if ($method === 'POST' && $action === 'login') {
        login_usuario();
    }

    if ($method === 'GET' && $action === 'me') {
        me_usuario();
    }

    error_response('Método não permitido.', 405);
}

function handle_usuarios(): void
{
    $method = $_SERVER['REQUEST_METHOD'];
    $id = $_GET['id'] ?? null;

    if ($method === 'GET') {
        list_usuarios();
    }

    if ($method === 'POST') {
        create_usuario();
    }

    if ($method === 'PATCH' && $id) {
        update_usuario($id);
    }

    if ($method === 'DELETE' && $id) {
        delete_usuario($id);
    }

    error_response('Método não permitido.', 405);
}

function base64url_encode_value(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64url_decode_value(string $value): string
{
    $padding = strlen($value) % 4;

    if ($padding > 0) {
        $value .= str_repeat('=', 4 - $padding);
    }

    $decoded = base64_decode(strtr($value, '-_', '+/'), true);

    if ($decoded === false) {
        error_response('Token inválido.', 401);
    }

    return $decoded;
}

function create_token(array $usuario): string
{
    $config = sinalizamap_config();
    $payload = json_encode([
        'sub' => $usuario['id'],
        'email' => $usuario['email'],
        'exp' => time() + (60 * 60 * 24 * 7),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $encodedPayload = base64url_encode_value($payload);
    $signature = hash_hmac('sha256', $encodedPayload, $config['app_secret'], true);

    return $encodedPayload . '.' . base64url_encode_value($signature);
}

function bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (!$header && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        return trim($matches[1]);
    }

    return null;
}

function current_user_id(): string
{
    $token = bearer_token();

    if (!$token || strpos($token, '.') === false) {
        error_response('Sessão não informada.', 401);
    }

    [$encodedPayload, $encodedSignature] = explode('.', $token, 2);
    $config = sinalizamap_config();
    $expectedSignature = base64url_encode_value(
        hash_hmac('sha256', $encodedPayload, $config['app_secret'], true)
    );

    if (!hash_equals($expectedSignature, $encodedSignature)) {
        error_response('Sessão inválida.', 401);
    }

    $payload = json_decode(base64url_decode_value($encodedPayload), true);

    if (!is_array($payload) || empty($payload['sub']) || empty($payload['exp'])) {
        error_response('Sessão inválida.', 401);
    }

    if ((int) $payload['exp'] < time()) {
        error_response('Sessão expirada.', 401);
    }

    return (string) $payload['sub'];
}

function map_usuario(array $row): array
{
    return [
        '$id' => $row['id'],
        '$createdAt' => date(DATE_ATOM, strtotime($row['criado_em'])),
        '$updatedAt' => date(DATE_ATOM, strtotime($row['atualizado_em'])),
        'id' => $row['id'],
        'nome' => $row['nome'],
        'name' => $row['nome'],
        'email' => $row['email'],
        'perfil' => $row['perfil'],
        'prefs' => ['role' => $row['perfil']],
        'ativo' => (bool) $row['ativo'],
        'criado_em' => date(DATE_ATOM, strtotime($row['criado_em'])),
        'atualizado_em' => date(DATE_ATOM, strtotime($row['atualizado_em'])),
    ];
}

function find_usuario_by_id_or_fail(PDO $pdo, string $id): array
{
    $statement = $pdo->prepare('SELECT * FROM usuarios WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();

    if (!$row) {
        error_response('Usuário não encontrado.', 404);
    }

    return $row;
}

function login_usuario(): void
{
    $pdo = sinalizamap_pdo();
    $data = request_json();
    require_fields($data, ['email', 'password']);

    $statement = $pdo->prepare('SELECT * FROM usuarios WHERE email = :email LIMIT 1');
    $statement->execute(['email' => strtolower(trim($data['email']))]);
    $usuario = $statement->fetch();

    if (!$usuario || !$usuario['ativo'] || !password_verify($data['password'], $usuario['senha_hash'] ?? '')) {
        error_response('E-mail ou senha inválidos.', 401);
    }

    json_response([
        'token' => create_token($usuario),
        'user' => map_usuario($usuario),
    ]);
}

function me_usuario(): void
{
    $pdo = sinalizamap_pdo();
    $usuario = find_usuario_by_id_or_fail($pdo, current_user_id());

    if (!$usuario['ativo']) {
        error_response('Usuário inativo.', 403);
    }

    json_response(map_usuario($usuario));
}

function list_usuarios(): void
{
    $pdo = sinalizamap_pdo();
    $statement = $pdo->query('SELECT * FROM usuarios ORDER BY nome ASC');
    $rows = array_map('map_usuario', $statement->fetchAll());

    json_response([
        'total' => count($rows),
        'rows' => $rows,
    ]);
}

function create_usuario(): void
{
    $pdo = sinalizamap_pdo();
    $data = request_json();
    require_fields($data, ['nome', 'email', 'perfil']);

    $id = uuid_v4();
    $statement = $pdo->prepare(
        'INSERT INTO usuarios (id, nome, email, senha_hash, perfil, ativo)
         VALUES (:id, :nome, :email, :senha_hash, :perfil, :ativo)'
    );

    $statement->execute([
        'id' => $id,
        'nome' => trim($data['nome']),
        'email' => strtolower(trim($data['email'])),
        'senha_hash' => !empty($data['senha']) ? password_hash($data['senha'], PASSWORD_DEFAULT) : null,
        'perfil' => $data['perfil'],
        'ativo' => empty($data['ativo']) ? 0 : 1,
    ]);

    json_response(map_usuario(find_usuario_by_id_or_fail($pdo, $id)), 201);
}

function update_usuario(string $id): void
{
    $pdo = sinalizamap_pdo();
    $data = request_json();
    $allowedFields = ['nome', 'email', 'perfil', 'ativo'];
    $updates = array_intersect_key($data, array_flip($allowedFields));

    if (!empty($data['senha'])) {
        $updates['senha_hash'] = password_hash($data['senha'], PASSWORD_DEFAULT);
    }

    if (isset($updates['email'])) {
        $updates['email'] = strtolower(trim($updates['email']));
    }

    if (isset($updates['nome'])) {
        $updates['nome'] = trim($updates['nome']);
    }

    if (isset($updates['ativo'])) {
        $updates['ativo'] = empty($updates['ativo']) ? 0 : 1;
    }

    if (count($updates) === 0) {
        error_response('Nenhum campo válido para atualizar.', 422);
    }

    $setParts = array_map(function ($field) {
        return "{$field} = :{$field}";
    }, array_keys($updates));
    $statement = $pdo->prepare('UPDATE usuarios SET ' . implode(', ', $setParts) . ' WHERE id = :id');
    $statement->execute(array_merge($updates, ['id' => $id]));

    json_response(map_usuario(find_usuario_by_id_or_fail($pdo, $id)));
}

function delete_usuario(string $id): void
{
    $pdo = sinalizamap_pdo();
    $statement = $pdo->prepare('DELETE FROM usuarios WHERE id = :id');
    $statement->execute(['id' => $id]);

    json_response(['ok' => true]);
}

function map_sinalizacao(array $row): array
{
    return [
        '$id' => $row['id'],
        '$createdAt' => date(DATE_ATOM, strtotime($row['criado_em'])),
        '$updatedAt' => date(DATE_ATOM, strtotime($row['atualizado_em'])),
        'tipo_id' => $row['tipo_id'],
        'tipo_nome' => $row['tipo_nome'],
        'categoria' => $row['categoria'],
        'condicao' => $row['condicao'],
        'latitude' => (float) $row['latitude'],
        'longitude' => (float) $row['longitude'],
        'endereco' => $row['endereco'],
        'observacoes' => $row['observacoes'],
        'foto_nome' => $row['foto_nome'],
        'patrimonio' => $row['patrimonio'],
        'status' => $row['status'],
        'criado_por' => $row['criado_por'],
        'excluida_motivo' => $row['excluida_motivo'],
        'excluida_por' => $row['excluida_por'],
        'excluida_em' => $row['excluida_em'],
    ];
}

function map_historico(array $row): array
{
    return [
        '$id' => $row['id'],
        '$createdAt' => date(DATE_ATOM, strtotime($row['criado_em'])),
        '$updatedAt' => date(DATE_ATOM, strtotime($row['atualizado_em'])),
        'sinalizacao_id' => $row['sinalizacao_id'],
        'acao' => $row['acao'],
        'motivo' => $row['motivo'],
        'data_ocorrencia' => $row['data_ocorrencia'],
        'dados_anteriores' => $row['dados_anteriores'],
        'dados_novos' => $row['dados_novos'],
        'criado_por' => $row['criado_por'],
    ];
}

function find_sinalizacao_or_fail(PDO $pdo, string $id): array
{
    $statement = $pdo->prepare('SELECT * FROM sinalizacoes WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();

    if (!$row) {
        error_response('Sinalização não encontrada.', 404);
    }

    return $row;
}

function create_historico(PDO $pdo, array $input): void
{
    $statement = $pdo->prepare(
        'INSERT INTO historico_sinalizacoes
          (id, sinalizacao_id, acao, motivo, data_ocorrencia, dados_anteriores, dados_novos, criado_por)
         VALUES
          (:id, :sinalizacao_id, :acao, :motivo, :data_ocorrencia, :dados_anteriores, :dados_novos, :criado_por)'
    );

    $statement->execute([
        'id' => uuid_v4(),
        'sinalizacao_id' => $input['sinalizacao_id'],
        'acao' => $input['acao'],
        'motivo' => $input['motivo'] ?? null,
        'data_ocorrencia' => $input['data_ocorrencia'] ?? null,
        'dados_anteriores' => isset($input['dados_anteriores'])
            ? json_encode($input['dados_anteriores'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            : null,
        'dados_novos' => isset($input['dados_novos'])
            ? json_encode($input['dados_novos'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            : null,
        'criado_por' => $input['criado_por'],
    ]);
}

function list_sinalizacoes(): void
{
    $pdo = sinalizamap_pdo();
    $statement = $pdo->query(
        "SELECT * FROM sinalizacoes WHERE status <> 'excluida' ORDER BY criado_em DESC LIMIT 100"
    );
    $rows = array_map('map_sinalizacao', $statement->fetchAll());

    json_response([
        'total' => count($rows),
        'rows' => $rows,
    ]);
}

function get_sinalizacao(string $id): void
{
    $pdo = sinalizamap_pdo();
    json_response(map_sinalizacao(find_sinalizacao_or_fail($pdo, $id)));
}

function create_sinalizacao(): void
{
    $pdo = sinalizamap_pdo();
    $data = request_json();
    require_fields($data, [
        'tipo_id',
        'tipo_nome',
        'categoria',
        'condicao',
        'latitude',
        'longitude',
        'criado_por',
    ]);

    $id = uuid_v4();

    $pdo->beginTransaction();

    $statement = $pdo->prepare(
        'INSERT INTO sinalizacoes
          (id, tipo_id, tipo_nome, categoria, condicao, latitude, longitude, endereco, observacoes,
           foto_nome, patrimonio, status, criado_por)
         VALUES
          (:id, :tipo_id, :tipo_nome, :categoria, :condicao, :latitude, :longitude, :endereco, :observacoes,
           :foto_nome, :patrimonio, :status, :criado_por)'
    );

    $statement->execute([
        'id' => $id,
        'tipo_id' => $data['tipo_id'],
        'tipo_nome' => $data['tipo_nome'],
        'categoria' => $data['categoria'],
        'condicao' => $data['condicao'],
        'latitude' => $data['latitude'],
        'longitude' => $data['longitude'],
        'endereco' => $data['endereco'] ?? null,
        'observacoes' => $data['observacoes'] ?? null,
        'foto_nome' => $data['foto_nome'] ?? null,
        'patrimonio' => $data['patrimonio'] ?? null,
        'status' => 'registrada',
        'criado_por' => $data['criado_por'],
    ]);

    $created = map_sinalizacao(find_sinalizacao_or_fail($pdo, $id));
    create_historico($pdo, [
        'sinalizacao_id' => $id,
        'acao' => 'criada',
        'motivo' => $data['motivo'] ?? null,
        'data_ocorrencia' => $data['data_ocorrencia'] ?? null,
        'dados_novos' => $created,
        'criado_por' => $data['criado_por'],
    ]);

    $pdo->commit();

    if (($created['categoria'] ?? '') === 'irregularidade') {
        notify_telegram_irregularidade($created);
    }

    json_response($created, 201);
}

function update_sinalizacao(string $id): void
{
    $pdo = sinalizamap_pdo();
    $data = request_json();
    $metadata = $data['_metadata'] ?? [];
    unset($data['_metadata']);

    $allowedFields = [
        'tipo_id',
        'tipo_nome',
        'categoria',
        'condicao',
        'latitude',
        'longitude',
        'endereco',
        'observacoes',
        'foto_nome',
        'patrimonio',
        'status',
    ];

    $updates = array_intersect_key($data, array_flip($allowedFields));

    if (count($updates) === 0) {
        error_response('Nenhum campo válido para atualizar.', 422);
    }

    $pdo->beginTransaction();
    $previous = map_sinalizacao(find_sinalizacao_or_fail($pdo, $id));
    $setParts = array_map(function ($field) {
        return "{$field} = :{$field}";
    }, array_keys($updates));
    $setSql = implode(', ', $setParts);
    $statement = $pdo->prepare("UPDATE sinalizacoes SET {$setSql} WHERE id = :id");
    $statement->execute(array_merge($updates, ['id' => $id]));
    $updated = map_sinalizacao(find_sinalizacao_or_fail($pdo, $id));

    create_historico($pdo, [
        'sinalizacao_id' => $id,
        'acao' => 'editada',
        'motivo' => $metadata['motivo'] ?? null,
        'data_ocorrencia' => $metadata['data_ocorrencia'] ?? null,
        'dados_anteriores' => $previous,
        'dados_novos' => $updated,
        'criado_por' => $metadata['criado_por'] ?? ($updated['criado_por'] ?? 'sistema'),
    ]);

    $pdo->commit();
    json_response($updated);
}

function delete_sinalizacao(string $id): void
{
    $pdo = sinalizamap_pdo();
    $data = request_json();
    require_fields($data, ['motivo', 'criado_por']);

    $pdo->beginTransaction();
    $previous = map_sinalizacao(find_sinalizacao_or_fail($pdo, $id));

    $statement = $pdo->prepare(
        "UPDATE sinalizacoes
         SET status = 'excluida', excluida_motivo = :motivo, excluida_por = :criado_por, excluida_em = NOW()
         WHERE id = :id"
    );
    $statement->execute([
        'id' => $id,
        'motivo' => $data['motivo'],
        'criado_por' => $data['criado_por'],
    ]);

    $updated = map_sinalizacao(find_sinalizacao_or_fail($pdo, $id));
    create_historico($pdo, [
        'sinalizacao_id' => $id,
        'acao' => 'excluida',
        'motivo' => $data['motivo'],
        'dados_anteriores' => $previous,
        'dados_novos' => $updated,
        'criado_por' => $data['criado_por'],
    ]);

    $pdo->commit();
    json_response($updated);
}

function resolve_sinalizacao(string $id): void
{
    $pdo = sinalizamap_pdo();
    $data = request_json();
    require_fields($data, ['realizado', 'data_ocorrencia', 'criado_por']);

    $pdo->beginTransaction();
    $previous = map_sinalizacao(find_sinalizacao_or_fail($pdo, $id));

    $statement = $pdo->prepare("UPDATE sinalizacoes SET status = 'resolvida' WHERE id = :id");
    $statement->execute(['id' => $id]);

    $updated = map_sinalizacao(find_sinalizacao_or_fail($pdo, $id));
    create_historico($pdo, [
        'sinalizacao_id' => $id,
        'acao' => 'corrigida',
        'motivo' => $data['realizado'],
        'data_ocorrencia' => $data['data_ocorrencia'],
        'dados_anteriores' => $previous,
        'dados_novos' => [
            'status' => 'resolvida',
            'realizado' => $data['realizado'],
            'data_ocorrencia' => $data['data_ocorrencia'],
        ],
        'criado_por' => $data['criado_por'],
    ]);

    $pdo->commit();
    json_response($updated);
}

function list_historico_sinalizacao(string $id): void
{
    $pdo = sinalizamap_pdo();
    $statement = $pdo->prepare(
        'SELECT * FROM historico_sinalizacoes WHERE sinalizacao_id = :id ORDER BY criado_em DESC LIMIT 100'
    );
    $statement->execute(['id' => $id]);
    $rows = array_map('map_historico', $statement->fetchAll());

    json_response([
        'total' => count($rows),
        'rows' => $rows,
    ]);
}
