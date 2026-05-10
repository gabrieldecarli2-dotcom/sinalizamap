export function getCondicaoLabel(condicao: string) {
  if (condicao === 'irregularidade') {
    return 'Irregularidade'
  }

  const nota = Number(condicao)

  if (Number.isFinite(nota)) {
    const normalizedNote = Math.min(5, Math.max(0, nota))
    return `Nota ${normalizedNote}/5`
  }

  const labels: Record<string, string> = {
    boa: 'Boa',
    regular: 'Regular',
    danificada: 'Danificada',
    ausente: 'Ausente',
    necessita_manutencao: 'Necessita manutenção',
  }

  return labels[condicao] ?? condicao
}

export function getCondicaoNome(condicao: string) {
  if (condicao === 'irregularidade') {
    return 'Irregularidade'
  }

  const nota = Number(condicao)

  if (Number.isFinite(nota)) {
    const normalizedNote = Math.min(5, Math.max(0, nota))

    if (normalizedNote === 0) {
      return 'Ausente'
    }

    if (normalizedNote === 1) {
      return 'Crítica'
    }

    if (normalizedNote <= 3) {
      return 'Regular'
    }

    if (normalizedNote === 4) {
      return 'Boa'
    }

    return 'Excelente'
  }

  const labels: Record<string, string> = {
    boa: 'Boa',
    regular: 'Regular',
    danificada: 'Danificada',
    ausente: 'Ausente',
    necessita_manutencao: 'Necessita manutenção',
  }

  return labels[condicao] ?? condicao
}

export function isCondicaoPendente(condicao: string) {
  if (condicao === 'irregularidade') {
    return false
  }

  const nota = Number(condicao)

  if (Number.isFinite(nota)) {
    return nota <= 2
  }

  return condicao === 'danificada' || condicao === 'necessita_manutencao' || condicao === 'ausente'
}

export function getCondicaoColor(condicao: string) {
  const nota = Number(condicao)
  const normalizedNote = Number.isFinite(nota) ? Math.min(5, Math.max(0, nota)) : null

  if (normalizedNote !== null) {
    const hue = Math.round((normalizedNote / 5) * 120)
    return `hsl(${hue} 72% 43%)`
  }

  const legacyColors: Record<string, string> = {
    ausente: 'hsl(0 72% 43%)',
    danificada: 'hsl(24 72% 43%)',
    necessita_manutencao: 'hsl(48 72% 43%)',
    regular: 'hsl(72 72% 43%)',
    boa: 'hsl(108 72% 43%)',
  }

  return legacyColors[condicao] ?? '#475569'
}
