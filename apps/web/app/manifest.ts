import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "monomi",
    short_name: "monomi",
    description: "Get paid to check places near you.",
    start_url: "/jobs",
    display: "standalone",
    background_color: "#EFEBE2",
    theme_color: "#0B0C0A",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  }
}
