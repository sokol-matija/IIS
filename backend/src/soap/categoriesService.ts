import fs from "fs";
import path from "path";
import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";
import { validateXmlAgainstXsd } from "../utils/validateXml";

const GENERATED_DIR = path.resolve(__dirname, "../../generated");
const XML_PATH = path.join(GENERATED_DIR, "categories.xml");

interface CategoryResult {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface SearchArgs {
  term: string;
}

export const categoriesService = {
  CategoriesService: {
    CategoriesPort: {
      SearchCategories: (args: SearchArgs) => {
        const term = args.term?.toLowerCase() || "";

        if (!fs.existsSync(XML_PATH)) {
          return { categories: [] };
        }

        const xmlContent = fs.readFileSync(XML_PATH, "utf-8");

        // Validate XML before processing
        const validation = validateXmlAgainstXsd(xmlContent);
        if (!validation.valid) {
          console.error("XML validation failed:", validation.errors);
        }

        // Use XPath to find matching categories
        const doc = new DOMParser().parseFromString(xmlContent, "text/xml");

        const xpathQuery = `//category[
          contains(translate(name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}') or
          contains(translate(description, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}')
        ]`;

        const nodes = xpath.select(xpathQuery, doc as unknown as Node);

        const categories: CategoryResult[] = [];

        if (Array.isArray(nodes)) {
          for (const node of nodes) {
            const el = node as unknown as {
              getElementsByTagName(name: string): {
                length: number;
                [index: number]: { firstChild: { nodeValue: string | null } | null };
              };
            };

            const getTextContent = (tagName: string): string => {
              const elements = el.getElementsByTagName(tagName);
              if (elements.length > 0 && elements[0]?.firstChild) {
                return elements[0].firstChild.nodeValue || "";
              }
              return "";
            };

            categories.push({
              id: parseInt(getTextContent("id")) || 0,
              name: getTextContent("name"),
              slug: getTextContent("slug"),
              description: getTextContent("description"),
            });
          }
        }

        return { categories };
      },
    },
  },
};
