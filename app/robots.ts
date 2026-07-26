import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/", 
        "/_next/", 
        "/dashboard", 
        "/upload", 
        "/doubt-solver", 
        "/textbook-chat", 
        "/feynman", 
        "/flashcards"
      ],
    },
    sitemap: "https://edumethod-ai.vercel.app/sitemap.xml",
  };
}
