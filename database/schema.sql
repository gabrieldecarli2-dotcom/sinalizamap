CREATE TABLE IF NOT EXISTS usuarios (
  id CHAR(36) PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NULL,
  perfil VARCHAR(40) NOT NULL DEFAULT 'usuario',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tipos_sinalizacao (
  id VARCHAR(80) PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  categoria ENUM('horizontal', 'vertical') NOT NULL,
  grupo VARCHAR(120) NULL,
  codigo VARCHAR(80) NULL,
  descricao TEXT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sinalizacoes (
  id CHAR(36) PRIMARY KEY,
  tipo_id VARCHAR(80) NOT NULL,
  tipo_nome VARCHAR(160) NOT NULL,
  categoria VARCHAR(40) NOT NULL,
  condicao VARCHAR(40) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  endereco VARCHAR(255) NULL,
  observacoes TEXT NULL,
  foto_nome VARCHAR(255) NULL,
  patrimonio VARCHAR(120) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'registrada',
  criado_por VARCHAR(160) NOT NULL,
  excluida_motivo TEXT NULL,
  excluida_por VARCHAR(160) NULL,
  excluida_em DATETIME NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sinalizacoes_status (status),
  INDEX idx_sinalizacoes_tipo (tipo_id),
  INDEX idx_sinalizacoes_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS historico_sinalizacoes (
  id CHAR(36) PRIMARY KEY,
  sinalizacao_id CHAR(36) NOT NULL,
  acao ENUM('criada', 'editada', 'excluida', 'corrigida') NOT NULL,
  motivo TEXT NULL,
  data_ocorrencia DATE NULL,
  dados_anteriores JSON NULL,
  dados_novos JSON NULL,
  criado_por VARCHAR(160) NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_historico_sinalizacao (sinalizacao_id),
  CONSTRAINT fk_historico_sinalizacao
    FOREIGN KEY (sinalizacao_id) REFERENCES sinalizacoes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
