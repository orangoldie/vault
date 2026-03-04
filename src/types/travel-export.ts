export interface RawTripLocation {
  id: number
  name: string
  detail: string
  full_detail: string
  country_code: string
  lat: number
  lon: number
  uuid: string
}

export interface RawStep {
  id: number
  trip_id: number
  display_name: string
  description: string | null
  slug: string
  start_time: number
  end_time: number | null
  location: RawTripLocation
  weather_condition: string | null
  weather_temperature: number | null
  uuid: string
}

export interface RawCoverPhoto {
  id: number
  path: string
  uuid: string
}

export interface RawTrip {
  id: number
  name: string
  slug: string
  start_date: number
  end_date: number
  summary: string
  cover_photo: RawCoverPhoto | null
  step_count: number
  total_km: number
  uuid: string
  all_steps: RawStep[]
}
