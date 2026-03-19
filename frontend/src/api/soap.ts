const API_URL = import.meta.env.VITE_API_URL || ""

export interface SoapCategory {
  id: string
  name: string
  slug: string
  description: string
}

export interface SoapResult {
  categories: SoapCategory[]
  envelope: string
  rawResponse: string
}

export async function searchCategoriesSoap(term: string): Promise<SoapResult> {
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://iis.hr/categories">
  <soap:Body>
    <tns:SearchCategoriesRequest>
      <tns:term>${escapeXml(term)}</tns:term>
    </tns:SearchCategoriesRequest>
  </soap:Body>
</soap:Envelope>`

  const res = await fetch(`${API_URL}/soap`, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "http://iis.hr/categories/SearchCategories",
    },
    body: envelope,
  })

  const rawResponse = await res.text()

  // Parse SOAP response to extract categories
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawResponse, "text/xml")

  const categories: SoapCategory[] = []
  const catNodes = doc.getElementsByTagName("categories")

  for (let i = 0; i < catNodes.length; i++) {
    const node = catNodes[i]
    const getText = (tag: string): string => {
      const els = node.getElementsByTagName(tag)
      return els.length > 0 ? els[0].textContent || "" : ""
    }

    const id = getText("id")
    const name = getText("name")
    if (name) {
      categories.push({
        id,
        name,
        slug: getText("slug"),
        description: getText("description"),
      })
    }
  }

  return { categories, envelope, rawResponse }
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
