import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import Task2Page from "../pages/Task2Page"
import { AuthInit } from "../store/authStore"
import * as soapApi from "../api/soap"
import { createTestQueryClient } from "./test-utils"

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <>
          <AuthInit />
          {children}
        </>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe("Task2Page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
  })

  it("renders the page title and search form", () => {
    render(<Task2Page />, { wrapper: Wrapper })
    expect(screen.getByText(/Task 2/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search term/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /search via soap/i })).toBeInTheDocument()
  })

  it("shows Generate XML button", () => {
    render(<Task2Page />, { wrapper: Wrapper })
    expect(screen.getByRole("button", { name: /generate xml/i })).toBeInTheDocument()
  })

  it("calls searchCategoriesSoap and shows results", async () => {
    const user = userEvent.setup()
    vi.spyOn(soapApi, "searchCategoriesSoap").mockResolvedValue({
      categories: [
        { id: "1", name: "Electronics", slug: "electronics", description: "Devices" },
        { id: "2", name: "Books", slug: "books", description: "" },
      ],
      envelope: "<soap:Envelope/>",
      rawResponse: "<soap:Envelope/>",
    })

    render(<Task2Page />, { wrapper: Wrapper })

    await user.type(screen.getByPlaceholderText(/search term/i), "electr")
    await user.click(screen.getByRole("button", { name: /search via soap/i }))

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument()
      expect(screen.getByText("Books")).toBeInTheDocument()
    })
    expect(soapApi.searchCategoriesSoap).toHaveBeenCalledWith("electr")
  })

  it("shows error message when SOAP search fails", async () => {
    const user = userEvent.setup()
    vi.spyOn(soapApi, "searchCategoriesSoap").mockRejectedValue(
      new Error("SOAP endpoint unavailable")
    )

    render(<Task2Page />, { wrapper: Wrapper })

    await user.type(screen.getByPlaceholderText(/search term/i), "test")
    await user.click(screen.getByRole("button", { name: /search via soap/i }))

    await waitFor(() => {
      expect(screen.getByText("SOAP endpoint unavailable")).toBeInTheDocument()
    })
  })

  it("Generate XML button calls /api/generate-xml and shows success", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "XML generated successfully" }),
      })
    )

    render(<Task2Page />, { wrapper: Wrapper })
    await user.click(screen.getByRole("button", { name: /generate xml/i }))

    await waitFor(() => {
      expect(screen.getByText("XML generated successfully")).toBeInTheDocument()
    })
  })

  it("shows empty state prompt when no results yet", () => {
    render(<Task2Page />, { wrapper: Wrapper })
    expect(screen.getByText(/enter a search term/i)).toBeInTheDocument()
  })
})
