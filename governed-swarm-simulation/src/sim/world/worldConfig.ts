export interface NoGoZoneConfig {
  id: string
  center: [number, number, number]
  size: [number, number, number]
}

export interface HarborStructureConfig {
  id: string
  position: [number, number, number]
  size: [number, number, number]
}

export interface InfrastructureMarkerConfig {
  id: string
  position: [number, number, number]
  kind: 'PLATFORM' | 'BUOY' | 'CABLE_NODE'
}

export const WORLD_EXTENTS = {
  oceanSize: 800,
  coastlineWidth: 160,
}

export const NO_GO_ZONES: NoGoZoneConfig[] = [
  {
    id: 'harbor_inner_sanctuary',
    center: [40, 30, -120],
    size: [120, 40, 110],
  },
  {
    id: 'subsea_cable_corridor',
    center: [-120, 25, 40],
    size: [260, 30, 60],
  },
]

export const HARBOR_STRUCTURES: HarborStructureConfig[] = [
  {
    id: 'main_pier',
    position: [0, 4, -60],
    size: [120, 8, 28],
  },
  {
    id: 'secondary_pier',
    position: [-90, 4, -30],
    size: [70, 8, 22],
  },
  {
    id: 'offshore_platform',
    position: [120, 8, -10],
    size: [26, 16, 26],
  },
]

export const INFRASTRUCTURE_MARKERS: InfrastructureMarkerConfig[] = [
  {
    id: 'platform_alpha',
    position: [120, 10, -10],
    kind: 'PLATFORM',
  },
  {
    id: 'harbor_buoy_north',
    position: [40, 6, -120],
    kind: 'BUOY',
  },
  {
    id: 'harbor_buoy_south',
    position: [-40, 6, -120],
    kind: 'BUOY',
  },
  {
    id: 'cable_node_west',
    position: [-180, 3, 40],
    kind: 'CABLE_NODE',
  },
  {
    id: 'cable_node_east',
    position: [-60, 3, 40],
    kind: 'CABLE_NODE',
  },
]

