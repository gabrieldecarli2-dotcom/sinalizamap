<?php

require __DIR__ . '/config/database.php';
require __DIR__ . '/lib/http.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $resource = $_GET['resource'] ?? '';

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
