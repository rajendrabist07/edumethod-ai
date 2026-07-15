import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://edumethod-ai.vercel.app";
  const routes = ["", "/sign-in", "/sign-up", "/dashboard", "/upload", "/doubt-solver", "/pricing"];
  
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
