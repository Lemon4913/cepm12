import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ตลาดท่านา | Talat Tha Na",
    short_name: "ตลาดท่านา",
    description:
      "เว็บแอปแผนที่ดิจิทัลและระบบสะสมตราประทับผ่านการสแกน QR Code สำหรับตลาดท่านา จ.นครปฐม",
    start_url: "/",
    display: "standalone",
    background_color: "#eff8f7",
    theme_color: "#0e8983",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
