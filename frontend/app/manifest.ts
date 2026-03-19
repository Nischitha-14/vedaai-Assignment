import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VedaAI",
    short_name: "VedaAI",
    description: "AI-powered assessment creation for teachers.",
    start_url: "/assignments",
    display: "standalone",
    background_color: "#17120e",
    theme_color: "#F5A623"
  };
}
