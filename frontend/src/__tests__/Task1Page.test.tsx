import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import Task1Page from "../pages/Task1Page"
import { AuthInit } from "../store/authStore"
import { createTestQueryClient } from "./test-utils"

function makeJwt(role: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256" }))
  const body = btoa(
    JSON.stringify({ userId: 1, email: "a@iis.hr", role, exp: Math.floor(Date.now() / 1000) + 900 })
  )
  return `${header}.${body}.sig`
}

function setup(role: string) {
  const token = makeJwt(role)
  window.localStorage.setItem("refreshToken", "r")
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: token, refreshToken: "r", role }),
    })
  )
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <>
          <AuthInit />
          <Task1Page />
        </>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe("Task1Page", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it("renders the page title", async () => {
    setup("full-access")
    expect(screen.getByText(/Task 1/)).toBeInTheDocument()
  })

  it("shows upload button disabled when no files are loaded", async () => {
    setup("full-access")
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /upload & validate/i })).toBeDisabled()
    })
  })

  it("disables upload button for read-only role", async () => {
    setup("read-only")
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /read-only/i })).toBeDisabled()
    })
  })

  it("shows XML and JSON upload zones", () => {
    setup("full-access")
    expect(screen.getByText("XML File")).toBeInTheDocument()
    expect(screen.getByText("JSON File")).toBeInTheDocument()
  })

  function mockFileReader(xmlText: string, jsonText: string) {
    let callCount = 0
    const contents = [xmlText, jsonText]
    class MockFileReader {
      onload: ((e: { target: { result: string } }) => void) | null = null
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      readAsText(_file: File) {
        const content = contents[callCount++]
        this.onload?.({ target: { result: content } })
      }
    }
    vi.stubGlobal("FileReader", MockFileReader)
  }

  it("displays success result after upload", async () => {
    const user = userEvent.setup()
    const token = makeJwt("full-access")
    window.localStorage.setItem("refreshToken", "r")

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accessToken: token, refreshToken: "r", role: "full-access" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 1, name: "Test", slug: "test" } }),
        })
    )
    mockFileReader("<category/>", '{"name":"Test","slug":"test"}')

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <>
            <AuthInit />
            <Task1Page />
          </>
        </MemoryRouter>
      </QueryClientProvider>
    )

    const xmlInput = document.querySelector("#xml-upload") as HTMLInputElement
    const jsonInput = document.querySelector("#json-upload") as HTMLInputElement
    await user.upload(xmlInput, new File(["<category/>"], "file.xml", { type: "text/xml" }))
    await user.upload(jsonInput, new File(['{"name":"Test"}'], "file.json", { type: "application/json" }))

    const submitBtn = await screen.findByRole("button", { name: /upload & validate/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/category saved successfully/i)).toBeInTheDocument()
    })
  })

  it("displays validation errors on failed upload", async () => {
    const user = userEvent.setup()
    const token = makeJwt("full-access")
    window.localStorage.setItem("refreshToken", "r")

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ accessToken: token, refreshToken: "r", role: "full-access" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ errors: ["Invalid XML structure", "Missing required field: name"] }),
        })
    )
    mockFileReader("<bad/>", "{}")

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <>
            <AuthInit />
            <Task1Page />
          </>
        </MemoryRouter>
      </QueryClientProvider>
    )

    const xmlInput = document.querySelector("#xml-upload") as HTMLInputElement
    const jsonInput = document.querySelector("#json-upload") as HTMLInputElement
    await user.upload(xmlInput, new File(["<bad/>"], "file.xml", { type: "text/xml" }))
    await user.upload(jsonInput, new File(["{}"], "file.json", { type: "application/json" }))

    const submitBtn = await screen.findByRole("button", { name: /upload & validate/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/validation errors/i)).toBeInTheDocument()
      expect(screen.getByText("Invalid XML structure")).toBeInTheDocument()
      expect(screen.getByText("Missing required field: name")).toBeInTheDocument()
    })
  })
})
