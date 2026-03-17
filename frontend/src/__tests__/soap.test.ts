import { describe, it, expect, vi, beforeEach } from "vitest"
import { searchCategoriesSoap } from "../api/soap"

const makeSoapResponse = (
  categories: Array<{ id: string; name: string; slug: string; description: string }>
) => {
  const items = categories
    .map(
      (c) =>
        `<categories>
          <id>${c.id}</id>
          <name>${c.name}</name>
          <slug>${c.slug}</slug>
          <description>${c.description}</description>
        </categories>`
    )
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SearchCategoriesResponse>${items}</SearchCategoriesResponse>
  </soap:Body>
</soap:Envelope>`
}

describe("searchCategoriesSoap", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns parsed categories from SOAP response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          makeSoapResponse([
            { id: "1", name: "Electronics", slug: "electronics", description: "Devices" },
            { id: "2", name: "Books", slug: "books", description: "" },
          ]),
      })
    )

    const result = await searchCategoriesSoap("electr")
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ id: "1", name: "Electronics", slug: "electronics" })
    expect(result[1]).toMatchObject({ name: "Books" })
  })

  it("returns empty array when no categories in response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => makeSoapResponse([]),
      })
    )

    const result = await searchCategoriesSoap("xyz")
    expect(result).toHaveLength(0)
  })

  it("sends a POST request with correct SOAPAction header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => makeSoapResponse([]),
    })
    vi.stubGlobal("fetch", fetchMock)

    await searchCategoriesSoap("test")

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/soap"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          SOAPAction: expect.stringContaining("SearchCategories"),
        }),
      })
    )
  })

  it("escapes XML special chars in the search term", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => makeSoapResponse([]),
    })
    vi.stubGlobal("fetch", fetchMock)

    await searchCategoriesSoap('<test>&"query"')

    const body: string = fetchMock.mock.calls[0][1].body
    expect(body).toContain("&lt;test&gt;&amp;")
    expect(body).not.toContain("<test>")
  })

  it("sends the search term in the SOAP body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => makeSoapResponse([]),
    })
    vi.stubGlobal("fetch", fetchMock)

    await searchCategoriesSoap("electronics")

    const body: string = fetchMock.mock.calls[0][1].body
    expect(body).toContain("electronics")
  })
})
