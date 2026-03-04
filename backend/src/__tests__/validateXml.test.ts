import { describe, it, expect } from 'vitest'
import { validateXmlAgainstXsd } from '../utils/validateXml'

describe('validateXmlAgainstXsd', () => {
  it('passes for valid single category XML', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<category>
  <name>Electronics</name>
  <slug>electronics</slug>
  <description>Electronic devices</description>
</category>`
    const result = validateXmlAgainstXsd(xml)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when name element is missing', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<category>
  <slug>electronics</slug>
</category>`
    const result = validateXmlAgainstXsd(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.toLowerCase().includes('name'))).toBe(true)
  })

  it('fails when slug element is missing', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<category>
  <name>Electronics</name>
</category>`
    const result = validateXmlAgainstXsd(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.toLowerCase().includes('slug'))).toBe(true)
  })

  it('fails for malformed XML (unclosed tag)', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<category>
  <name>Electronics</name>
  <slug>electronics</slug>`
    const result = validateXmlAgainstXsd(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('passes for valid categories list XML', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<categories>
  <category>
    <name>Electronics</name>
    <slug>electronics</slug>
    <description>Electronic devices</description>
  </category>
  <category>
    <name>Books</name>
    <slug>books</slug>
  </category>
</categories>`
    const result = validateXmlAgainstXsd(xml)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails for a category within categories list when name is missing', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<categories>
  <category>
    <name>Electronics</name>
    <slug>electronics</slug>
  </category>
  <category>
    <slug>books</slug>
  </category>
</categories>`
    const result = validateXmlAgainstXsd(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.toLowerCase().includes('name'))).toBe(true)
  })

  it('fails when root element is unexpected', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<unknown>
  <name>Electronics</name>
  <slug>electronics</slug>
</unknown>`
    const result = validateXmlAgainstXsd(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('unexpected') || e.toLowerCase().includes('root'))).toBe(true)
  })
})
