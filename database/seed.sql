INSERT INTO usuarios (id, nome, email, senha_hash, perfil, ativo)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Administrador',
  'admin@sinalizamap.local',
  '$2y$10$hSRLfAaw5nTBajdAMZHy6O44Y4e7ROWlC7k/8gA9oBSP/mHhyWTUa',
  'admin',
  1
)
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome),
  perfil = VALUES(perfil),
  ativo = VALUES(ativo);
