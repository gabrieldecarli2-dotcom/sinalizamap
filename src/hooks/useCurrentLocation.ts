import { useCallback, useEffect, useState } from 'react'

export interface CurrentLocation {
  latitude: number
  longitude: number
  accuracy: number | null
  updatedAt: Date
}

type LocationStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'unavailable' | 'error'

export function useCurrentLocation() {
  const hasGeolocation = 'geolocation' in navigator
  const [location, setLocation] = useState<CurrentLocation | null>(null)
  const [status, setStatus] = useState<LocationStatus>(
    hasGeolocation ? 'loading' : 'unavailable',
  )
  const [error, setError] = useState(
    hasGeolocation ? '' : 'Geolocalização não disponível neste dispositivo.',
  )

  const requestLocation = useCallback(() => {
    if (!hasGeolocation) {
      setStatus('unavailable')
      setError('Geolocalização não disponível neste dispositivo.')
      return
    }

    setStatus('loading')
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: new Date(position.timestamp),
        })
        setStatus('ready')
      },
      (positionError) => {
        setStatus(positionError.code === positionError.PERMISSION_DENIED ? 'denied' : 'error')
        setError(positionError.message || 'Não foi possível obter sua localização.')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 12000,
      },
    )
  }, [hasGeolocation])

  useEffect(() => {
    if (!hasGeolocation) {
      return undefined
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: new Date(position.timestamp),
        })
        setStatus('ready')
        setError('')
      },
      (positionError) => {
        setStatus(positionError.code === positionError.PERMISSION_DENIED ? 'denied' : 'error')
        setError(positionError.message || 'Não foi possível acompanhar sua localização.')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [hasGeolocation])

  return {
    location,
    status,
    error,
    requestLocation,
  }
}
