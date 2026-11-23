/**
 * A branded basemap, as a MapLibre style document (BiteSites site layer).
 *
 * Tiles arrive as vector geometry with no colour of their own; every fill below
 * comes from the palette passed in, so the water, roads and labels can follow
 * the chamber's navy without tinting the whole picture. Tiles and glyphs come
 * from OpenFreeMap (OpenStreetMap data): no API key, account or billing.
 */
import type { StyleSpecification } from 'maplibre-gl';

const OPENFREEMAP_TILES = 'https://tiles.openfreemap.org/planet';
const OPENFREEMAP_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

/** Required visible credit for OpenFreeMap and OpenStreetMap. Do not remove. */
export const MAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>';

export const DEFAULT_MAP_COLORS = {
  ground: '#e7edf5',
  greenery: '#d8e9e0',
  water: '#c8e4f3',
  waterLine: '#a9d3ea',
  building: '#d6e0ee',
  road: '#ffffff',
  roadCasing: '#ccd8e8',
  majorRoad: '#f5f9fd',
  majorCasing: '#b3cbe6',
  motorway: '#dceaf8',
  motorwayCasing: '#a9c8e6',
  label: '#031d3a',
  labelMuted: '#667085',
  waterLabel: '#0a6ab8',
  halo: '#ffffff',
};

export type MapPalette = Partial<typeof DEFAULT_MAP_COLORS>;

const SOURCE = 'openmaptiles';

/** A road stripe that grows with zoom. */
const roadWidth = (stops: [number, number][]) => ({ type: 'exponential' as const, base: 1.6, stops });

export function brandedMapStyle({ name = 'Branded location map', palette = {} }: { name?: string; palette?: MapPalette } = {}): StyleSpecification {
  const COLOR = { ...DEFAULT_MAP_COLORS, ...palette };

  return {
    version: 8,
    name,
    glyphs: OPENFREEMAP_GLYPHS,
    sources: {
      [SOURCE]: { type: 'vector', url: OPENFREEMAP_TILES, attribution: MAP_ATTRIBUTION },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': COLOR.ground } },
      {
        id: 'landcover', type: 'fill', source: SOURCE, 'source-layer': 'landcover',
        filter: ['in', 'class', 'wood', 'grass', 'farmland'],
        paint: { 'fill-color': COLOR.greenery, 'fill-opacity': 0.7 },
      },
      { id: 'park', type: 'fill', source: SOURCE, 'source-layer': 'park', paint: { 'fill-color': COLOR.greenery, 'fill-opacity': 0.8 } },
      {
        id: 'water', type: 'fill', source: SOURCE, 'source-layer': 'water',
        filter: ['!=', 'brunnel', 'tunnel'], paint: { 'fill-color': COLOR.water },
      },
      {
        id: 'waterway', type: 'line', source: SOURCE, 'source-layer': 'waterway',
        paint: { 'line-color': COLOR.waterLine, 'line-width': roadWidth([[9, 0.6], [16, 4]]) },
      },
      {
        id: 'building', type: 'fill', source: SOURCE, 'source-layer': 'building', minzoom: 13,
        paint: { 'fill-color': COLOR.building, 'fill-opacity': { type: 'exponential', base: 1, stops: [[13, 0], [14.5, 1]] } },
      },
      // Casing first so the outline sits under the stripe; minor roads first so importance survives overlap.
      {
        id: 'road-minor-casing', type: 'line', source: SOURCE, 'source-layer': 'transportation',
        filter: ['in', 'class', 'minor', 'service', 'track'], minzoom: 13,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COLOR.roadCasing, 'line-width': roadWidth([[13, 1.4], [18, 12]]) },
      },
      {
        id: 'road-minor', type: 'line', source: SOURCE, 'source-layer': 'transportation',
        filter: ['in', 'class', 'minor', 'service', 'track'], minzoom: 13,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COLOR.road, 'line-width': roadWidth([[13, 0.6], [18, 9]]) },
      },
      {
        id: 'road-secondary-casing', type: 'line', source: SOURCE, 'source-layer': 'transportation',
        filter: ['in', 'class', 'secondary', 'tertiary'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COLOR.roadCasing, 'line-width': roadWidth([[10, 1.6], [18, 18]]) },
      },
      {
        id: 'road-secondary', type: 'line', source: SOURCE, 'source-layer': 'transportation',
        filter: ['in', 'class', 'secondary', 'tertiary'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COLOR.road, 'line-width': roadWidth([[10, 0.8], [18, 14]]) },
      },
      {
        id: 'road-primary-casing', type: 'line', source: SOURCE, 'source-layer': 'transportation',
        filter: ['in', 'class', 'primary', 'trunk'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COLOR.majorCasing, 'line-width': roadWidth([[8, 1.8], [18, 22]]) },
      },
      {
        id: 'road-primary', type: 'line', source: SOURCE, 'source-layer': 'transportation',
        filter: ['in', 'class', 'primary', 'trunk'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COLOR.majorRoad, 'line-width': roadWidth([[8, 1], [18, 17]]) },
      },
      {
        id: 'road-motorway-casing', type: 'line', source: SOURCE, 'source-layer': 'transportation',
        filter: ['==', 'class', 'motorway'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COLOR.motorwayCasing, 'line-width': roadWidth([[6, 1.8], [18, 26]]) },
      },
      {
        id: 'road-motorway', type: 'line', source: SOURCE, 'source-layer': 'transportation',
        filter: ['==', 'class', 'motorway'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COLOR.motorway, 'line-width': roadWidth([[6, 1], [18, 20]]) },
      },
      // Labels last: text drawn before a fill would be buried by it.
      {
        id: 'road-label', type: 'symbol', source: SOURCE, 'source-layer': 'transportation_name', minzoom: 14,
        layout: { 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': roadWidth([[14, 10], [18, 13]]) },
        paint: { 'text-color': COLOR.labelMuted, 'text-halo-color': COLOR.halo, 'text-halo-width': 1.4 },
      },
      {
        id: 'water-label', type: 'symbol', source: SOURCE, 'source-layer': 'water_name',
        layout: { 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Italic'], 'text-size': 12 },
        paint: { 'text-color': COLOR.waterLabel, 'text-halo-color': COLOR.halo, 'text-halo-width': 1.4 },
      },
      {
        id: 'place-label', type: 'symbol', source: SOURCE, 'source-layer': 'place',
        filter: ['in', 'class', 'city', 'town', 'village', 'suburb', 'neighbourhood'],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'],
            10, ['match', ['get', 'class'], 'city', 15, 'town', 13, 11],
            16, ['match', ['get', 'class'], 'city', 20, 'town', 17, 14]],
          'text-max-width': 8,
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.06,
        },
        paint: { 'text-color': COLOR.label, 'text-halo-color': COLOR.halo, 'text-halo-width': 1.8 },
      },
    ],
  } as StyleSpecification;
}

/** The chamber's map: navy labels and water, quiet greys everywhere else so the pin reads first. */
export const DUSACCOM_MAP_PALETTE: MapPalette = {
  ground: '#eef1f5',
  greenery: '#dde9e2',
  water: '#c4d3e8',
  waterLine: '#a6bbda',
  building: '#dde3ec',
  road: '#ffffff',
  roadCasing: '#d2d9e3',
  majorRoad: '#fbfcfd',
  majorCasing: '#b6c3d6',
  motorway: '#e2e8f1',
  motorwayCasing: '#a9b8cf',
  label: '#032a63',
  labelMuted: '#5b6b80',
  waterLabel: '#284c85',
  halo: '#ffffff',
};
