import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Feature from 'ol/Feature'
import Map from 'ol/Map'
import View from 'ol/View'
import CircleGeom from 'ol/geom/Circle'
import Point from 'ol/geom/Point'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import { fromLonLat, toLonLat } from 'ol/proj'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, RegularShape, Stroke, Style } from 'ol/style'
import type { SinalizacaoDocument } from '../services/sinalizacoes'
import { lemeCenter } from '../constants/mapDefaults'
import { getCondicaoLabel, getCondicaoColor } from '../utils/condicao'

function createSignalStyle(sinalizacao: SinalizacaoDocument) {
  if (sinalizacao.categoria === 'irregularidade') {
    const isResolvida = sinalizacao.status === 'resolvida'

    return new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: isResolvida ? '#16a34a' : '#2563eb' }),
        stroke: new Stroke({ color: '#ffffff', width: 3 }),
      }),
    })
  }

  if (sinalizacao.categoria === 'vertical') {
    return new Style({
      image: new RegularShape({
        points: 3,
        radius: 12,
        fill: new Fill({ color: getCondicaoColor(sinalizacao.condicao) }),
        stroke: new Stroke({ color: '#ffffff', width: 3 }),
      }),
    })
  }

  return new Style({
    image: new RegularShape({
      points: 4,
      radius: 10,
      angle: Math.PI / 4,
      fill: new Fill({ color: getCondicaoColor(sinalizacao.condicao) }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
    }),
  })
}

const locationStyle = new Style({
  image: new CircleStyle({
    radius: 9,
    fill: new Fill({ color: '#ebb734' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
})

const gcmLocationStyle = new Style({
  image: new CircleStyle({
    radius: 9,
    fill: new Fill({ color: '#2563eb' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
})

const selectedStyle = new Style({
  image: new RegularShape({
    points: 3,
    radius: 14,
    rotation: Math.PI,
    fill: new Fill({ color: '#ebb734' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
})

const selectedGcmStyle = new Style({
  image: new CircleStyle({
    radius: 10,
    fill: new Fill({ color: '#2563eb' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
})

export function OpenLayersCampoMap({
  center,
  selectedPoint,
  sinalizacoes,
  followLocation,
  accuracy,
  onSelectPoint,
  mode = 'sinalizacao',
}: {
  center: [number, number] | null
  selectedPoint: [number, number] | null
  sinalizacoes: SinalizacaoDocument[]
  followLocation: boolean
  accuracy: number | null
  onSelectPoint: (position: [number, number]) => void
  mode?: 'sinalizacao' | 'gcm'
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const sourceRef = useRef(new VectorSource())
  const [selectedSinalizacao, setSelectedSinalizacao] =
    useState<SinalizacaoDocument | null>(null)

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return
    }

    const initialCenter = center
      ? fromLonLat([center[1], center[0]])
      : fromLonLat([lemeCenter.lng, lemeCenter.lat])

    const map = new Map({
      target: mapElementRef.current,
      layers: [
        new TileLayer({
          source: new OSM({ wrapX: false }),
        }),
        new VectorLayer({
          source: sourceRef.current,
        }),
      ],
      view: new View({
        center: initialCenter,
        zoom: center ? 18 : 13,
        minZoom: 4,
        maxZoom: 22,
      }),
      controls: [],
    })

    map.on('singleclick', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate)
      const sinalizacao = feature?.get('sinalizacao') as SinalizacaoDocument | undefined

      if (sinalizacao) {
        setSelectedSinalizacao(sinalizacao)
        return
      }

      const [lng, lat] = toLonLat(event.coordinate)
      setSelectedSinalizacao(null)
      onSelectPoint([lat, lng])
    })

    mapRef.current = map

    return () => {
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [center, onSelectPoint])

  useEffect(() => {
    const source = sourceRef.current
    source.clear()

    sinalizacoes.forEach((sinalizacao) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([sinalizacao.longitude, sinalizacao.latitude])),
        sinalizacao,
      })

      feature.setStyle(createSignalStyle(sinalizacao))
      source.addFeature(feature)
    })

    if (center) {
      const location = fromLonLat([center[1], center[0]])
      const locationFeature = new Feature({
        geometry: new Point(location),
      })
      locationFeature.setStyle(mode === 'gcm' ? gcmLocationStyle : locationStyle)
      source.addFeature(locationFeature)

      if (accuracy) {
        const accuracyFeature = new Feature({
          geometry: new CircleGeom(location, accuracy),
        })
        accuracyFeature.setStyle(
          new Style({
            fill: new Fill({ color: mode === 'gcm' ? 'rgba(37, 99, 235, 0.14)' : 'rgba(235, 183, 52, 0.16)' }),
            stroke: new Stroke({ color: mode === 'gcm' ? '#2563eb' : '#ebb734', width: 2 }),
          }),
        )
        source.addFeature(accuracyFeature)
      }
    }

    if (selectedPoint) {
      const selectedFeature = new Feature({
        geometry: new Point(fromLonLat([selectedPoint[1], selectedPoint[0]])),
      })
      selectedFeature.setStyle(mode === 'gcm' ? selectedGcmStyle : selectedStyle)
      source.addFeature(selectedFeature)
    }
  }, [accuracy, center, mode, selectedPoint, sinalizacoes])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !center || !followLocation) {
      return
    }

    map.getView().animate({
      center: fromLonLat([center[1], center[0]]),
      zoom: Math.max(map.getView().getZoom() ?? 18, 18),
      duration: 350,
    })
  }, [center, followLocation])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !selectedPoint) {
      return
    }

    map.getView().animate({
      center: fromLonLat([selectedPoint[1], selectedPoint[0]]),
      zoom: Math.max(map.getView().getZoom() ?? 18, 18),
      duration: 250,
    })
  }, [selectedPoint])

  return (
    <div className="absolute inset-0 z-0">
      <div ref={mapElementRef} className="h-full w-full" />

      {selectedSinalizacao && (
        <div className="absolute left-3 top-24 z-10 max-w-72 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-950">{selectedSinalizacao.tipo_nome}</p>
              <p className="mt-1 text-xs text-slate-600">
                {selectedSinalizacao.endereco || 'Sem endereço informado'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSinalizacao(null)}
              className="rounded px-2 text-slate-500 hover:bg-slate-100"
              aria-label="Fechar detalhes"
            >
              x
            </button>
          </div>
          {selectedSinalizacao.categoria !== 'irregularidade' && (
            <p className="admin-text mt-2 text-xs font-semibold">
              {getCondicaoLabel(selectedSinalizacao.condicao)}
            </p>
          )}
          {mode === 'gcm' ? (
            <div className="mt-3 space-y-2">
              <p
                className={`rounded-md px-3 py-2 text-xs font-semibold ${
                  selectedSinalizacao.status === 'resolvida'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {selectedSinalizacao.status === 'resolvida'
                  ? 'Irregularidade resolvida'
                  : 'Irregularidade pendente'}
              </p>
              <Link
                to={`/irregularidades/${selectedSinalizacao.$id}/editar`}
                className="inline-flex rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Editar irregularidade
              </Link>
            </div>
          ) : (
            <Link
              to={`/sinalizacoes/${selectedSinalizacao.$id}/editar`}
              className="admin-bg admin-bg-hover mt-3 inline-flex rounded-md px-3 py-2 text-xs font-semibold text-slate-950"
            >
              Editar sinalização
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
