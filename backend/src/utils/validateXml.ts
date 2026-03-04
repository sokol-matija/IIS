import { DOMParser } from "@xmldom/xmldom";

/**
 * Validates XML against the category XSD schema structure.
 * Uses @xmldom/xmldom for pure-JS XML parsing and structural validation.
 */
export function validateXmlAgainstXsd(xmlString: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const parseErrors: string[] = [];
    const parser = new DOMParser({
      onError: (level: string, msg: string) => {
        if (level === "error" || level === "fatalError") {
          parseErrors.push(String(msg));
        }
      },
    });

    const doc = parser.parseFromString(xmlString, "text/xml");

    if (parseErrors.length > 0) {
      return { valid: false, errors: parseErrors };
    }

    const root = doc.documentElement;
    if (!root) {
      return { valid: false, errors: ["No root element found"] };
    }

    const rootName = root.tagName;

    if (rootName === "category") {
      validateCategoryNode(root, errors);
    } else if (rootName === "categories") {
      const categoryElements = root.getElementsByTagName("category");
      for (let i = 0; i < categoryElements.length; i++) {
        validateCategoryNode(categoryElements[i]!, errors, i);
      }
    } else {
      errors.push(`Unexpected root element: ${rootName}. Expected 'category' or 'categories'.`);
    }

    return { valid: errors.length === 0, errors };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown XML parsing error";
    return { valid: false, errors: [message] };
  }
}

function validateCategoryNode(el: unknown, errors: string[], index?: number): void {
  const prefix = index !== undefined ? `category[${index}]: ` : "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = el as any;

  const nameEls = element.getElementsByTagName("name");
  if (nameEls.length === 0) {
    errors.push(`${prefix}Missing required element 'name'`);
  } else if (!nameEls[0]?.textContent?.trim()) {
    errors.push(`${prefix}Element 'name' must not be empty`);
  }

  const slugEls = element.getElementsByTagName("slug");
  if (slugEls.length === 0) {
    errors.push(`${prefix}Missing required element 'slug'`);
  } else if (!slugEls[0]?.textContent?.trim()) {
    errors.push(`${prefix}Element 'slug' must not be empty`);
  }
}
