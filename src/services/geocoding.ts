interface NominatimAddress {
  road?: string
  pedestrian?: string
  footway?: string
  path?: string
  house_number?: string
  suburb?: string
  neighbourhood?: string
  city_district?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  state?: string
}

interface NominatimReverseResponse {
  display_name?: string
  address?: NominatimAddress
}

function compactAddressParts(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(', ')
}

export async function reverseGeocode(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '18',
    addressdetails: '1',
    'accept-language': 'pt-BR,pt',
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`)

  if (!response.ok) {
    throw new Error('Não foi possível buscar o endereço aproximado.')
  }

  const data = (await response.json()) as NominatimReverseResponse
  const address = data.address

  if (!address) {
    return data.display_name ?? ''
  }

  const street = address.road ?? address.pedestrian ?? address.footway ?? address.path
  const district = address.suburb ?? address.neighbourhood ?? address.city_district
  const city = address.city ?? address.town ?? address.village ?? address.municipality

  return (
    compactAddressParts([
      compactAddressParts([street, address.house_number]),
      district,
      city,
      address.state,
    ]) || data.display_name || ''
  )
}
