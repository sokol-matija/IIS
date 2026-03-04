import { describe, it, expect } from 'vitest'
import { parseWeatherData } from '../weatherParser'

// Mock XML using the real DHMZ structure: Hrvatska > Grad[] with GradIme, Temp, Vrijeme
const MOCK_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Hrvatska>
  <Grad>
    <GradIme>Zagreb-Grič</GradIme>
    <Temp>12</Temp>
    <Vrijeme>Pretežno oblačno</Vrijeme>
  </Grad>
  <Grad>
    <GradIme>Split</GradIme>
    <Temp>18</Temp>
    <Vrijeme>Sunčano</Vrijeme>
  </Grad>
  <Grad>
    <GradIme>Osijek</GradIme>
    <Temp>10</Temp>
    <Vrijeme>Oblačno</Vrijeme>
  </Grad>
  <Grad>
    <GradIme>Rijeka</GradIme>
    <Temp>15</Temp>
    <Vrijeme>Djelomično oblačno</Vrijeme>
  </Grad>
</Hrvatska>`

describe('parseWeatherData', () => {
  it('filters by "Zagreb" and returns Zagreb-Grič', () => {
    const stations = parseWeatherData(MOCK_XML, 'Zagreb')
    expect(stations).toHaveLength(1)
    expect(stations[0].city).toBe('Zagreb-Grič')
    expect(stations[0].temperature).toBe('12')
    expect(stations[0].description).toBe('Pretežno oblačno')
  })

  it('filters case-insensitively: "split" (lowercase) returns Split', () => {
    const stations = parseWeatherData(MOCK_XML, 'split')
    expect(stations).toHaveLength(1)
    expect(stations[0].city).toBe('Split')
  })

  it('filters by "a" and returns all stations whose name contains "a"', () => {
    const stations = parseWeatherData(MOCK_XML, 'a')
    // Zagreb-Grič contains 'a', Split does not (all lowercase: no 'a'), Osijek has no 'a', Rijeka has 'a'
    // Let's verify which cities actually contain 'a' case-insensitively
    const expected = ['Zagreb-Grič', 'Split', 'Osijek', 'Rijeka'].filter((c) =>
      c.toLowerCase().includes('a')
    )
    expect(stations.map((s) => s.city)).toEqual(expect.arrayContaining(expected))
    expect(stations.length).toBe(expected.length)
  })

  it('returns empty array for "Nonexistent" filter', () => {
    const stations = parseWeatherData(MOCK_XML, 'Nonexistent')
    expect(stations).toHaveLength(0)
  })

  it('returns all stations when filter is empty string', () => {
    const stations = parseWeatherData(MOCK_XML, '')
    expect(stations).toHaveLength(4)
  })

  it('each station has city, temperature, and description fields', () => {
    const stations = parseWeatherData(MOCK_XML, '')
    for (const station of stations) {
      expect(station).toHaveProperty('city')
      expect(station).toHaveProperty('temperature')
      expect(station).toHaveProperty('description')
      expect(typeof station.city).toBe('string')
      expect(typeof station.temperature).toBe('string')
      expect(typeof station.description).toBe('string')
    }
  })

  it('handles empty XML gracefully', () => {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?><Hrvatska></Hrvatska>`
    const stations = parseWeatherData(emptyXml, '')
    expect(stations).toHaveLength(0)
  })
})
