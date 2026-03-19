import { create } from "zustand"

interface Task1State {
  xmlFileName: string | null
  jsonFileName: string | null
  xmlContent: string
  jsonContent: string
  setXmlFile: (name: string, content: string) => void
  setJsonFile: (name: string, content: string) => void
  setXmlContent: (content: string) => void
  setJsonContent: (content: string) => void
}

export const useTask1Store = create<Task1State>((set) => ({
  xmlFileName: null,
  jsonFileName: null,
  xmlContent: "",
  jsonContent: "",
  setXmlFile: (name, content) => set({ xmlFileName: name, xmlContent: content }),
  setJsonFile: (name, content) => set({ jsonFileName: name, jsonContent: content }),
  setXmlContent: (content) => set({ xmlContent: content }),
  setJsonContent: (content) => set({ jsonContent: content }),
}))
