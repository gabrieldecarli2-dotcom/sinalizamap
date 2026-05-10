import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Feature from 'ol/Feature'
import Map from 'ol/Map'
import View from 'ol/View'
import Point from 'ol/geom/Point'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import { fromLonLat } from 'ol/proj'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, RegularShape, Stroke, Style } from 'ol/style'
import type { SinalizacaoDocument } from '../services/sinalizacoes'
import { lemeCenter } from '../constants/mapDefaults'
import { getCondicaoLabel, getCondicaoColor } from '../utils/condicao'

function createMarkerStyle(sinalizacao: SinalizacaoDocument) {
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
        rotation: 0,
        fill: new Fill({ color: getCondicaoColor(sinalizacao.condicao) }),
        stroke: new Stroke({ color: '#ffffff', width: 3 }),
      }),
    })
  }

  if (sinalizacao.categoria === 'horizontal') {
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

  return new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({ color: getCondicaoColor(sinalizacao.condicao) }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
    }),
  })
}

export function OpenLayersSinalizacoesMap({
  sinalizacoes,
  compact = false,
}: {
  sinalizacoes: SinalizacaoDocument[]
  compact?: boolean
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const vectorSourceRef = useRef(new VectorSource())
  const [selectedSinalizacao, setSelectedSinalizacao] =
    useState<SinalizacaoDocument | null>(null)

  const center = useMemo(
    () =>
      sinalizacoes[0]
        ? fromLonLat([sinalizacoes[0].longitude, sinalizacoes[0].latitude])
        : fromLonLat([lemeCenter.lng, lemeCenter.lat]),
    [sinalizacoes],
  )

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return
    }

    const map = new Map({
      target: mapElementRef.current,
      layers: [
        new TileLayer({
          source: new OSM({
            wrapX: false,
          }),
        }),
        new VectorLayer({
          source: vectorSourceRef.current,
        }),
      ],
      view: new View({
        center,
        zoom: sinalizacoes.length ? 15 : 13,
        minZoom: 4,
        maxZoom: 22,
      }),
      controls: compact ? [] : undefined,
    })

    map.on('singleclick', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate)
      const sinalizacao = feature?.get('sinalizacao') as SinalizacaoDocument | undefined

      setSelectedSinalizacao(sinalizacao ?? null)
    })

    mapRef.current = map

    return () => {
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [center, compact, sinalizacoes.length])

  useEffect(() => {
    const source = vectorSourceRef.current
    source.clear()

    sinalizacoes.forEach((sinalizacao) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([sinalizacao.longitude, sinalizacao.latitude])),
        sinalizacao,
      })

      feature.setStyle(createMarkerStyle(sinalizacao))
      source.addFeature(feature)
    })

    const map = mapRef.current

    if (!map) {
      return
    }

    if (sinalizacoes.length === 0) {
      map.getView().animate({
        center: fromLonLat([lemeCenter.lng, lemeCenter.lat]),
        zoom: 13,
        duration: 250,
      })
      return
    }

    if (sinalizacoes.length === 1) {
      map.getView().animate({
        center,
        zoom: 18,
        duration: 250,
      })
      return
    }

    const extent = source.getExtent()
    if (!extent) {
      return
    }

    map.getView().fit(extent, {
      padding: [36, 36, 36, 36],
      maxZoom: 18,
      duration: 250,
    })
  }, [center, sinalizacoes])

  return (
    <div className="relative h-full min-h-full rounded-lg">
      <div ref={mapElementRef} className="h-full min-h-full rounded-lg" />

      {selectedSinalizacao && (
        <div className="absolute left-3 top-3 z-10 max-w-72 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-xl">
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
          {selectedSinalizacao.patrimonio && (
            <p className="mt-2 text-xs font-semibold text-slate-700">
              Patrimônio: {selectedSinalizacao.patrimonio}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
              {selectedSinalizacao.categoria === 'irregularidade'
                ? selectedSinalizacao.status === 'resolvida'
                  ? 'irregularidade resolvida'
                  : 'irregularidade pendente'
                : selectedSinalizacao.categoria}
            </span>
            {selectedSinalizacao.categoria !== 'irregularidade' && (
              <span className="rounded admin-bg-soft px-2 py-1 text-xs admin-text">
                {getCondicaoLabel(selectedSinalizacao.condicao)}
              </span>
            )}
          </div>
          <Link
            to={`/sinalizacoes/${selectedSinalizacao.$id}`}
            className="mt-3 inline-flex text-xs font-semibold admin-text hover:admin-text"
          >
            Ver detalhe
          </Link>
        </div>
      )}
    </div>
  )
}
