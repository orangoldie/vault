export interface Trip {
  id: number
  name: string
  slug: string
  startDate: number
  endDate: number
  summary: string
  coverPhotoId: string | null
  stepCount: number
  photoCount: number
  totalKm: number
  uuid: string
  importedAt: number
}

export interface StepLocation {
  name: string
  detail: string
  fullDetail: string
  countryCode: string
  lat: number
  lon: number
}

export interface Step {
  id: number
  tripId: number
  displayName: string
  description: string | null
  slug: string
  startTime: number
  endTime: number | null
  location: StepLocation
  weatherCondition: string | null
  weatherTemperature: number | null
  uuid: string
}

export interface Photo {
  id: string
  tripId: number
  stepId: number
  filename: string
}
