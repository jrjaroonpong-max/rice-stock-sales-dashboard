import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Rice Stock & Sales | Store 29 Trang",
  description: "Rice inventory, OOS and sales opportunity management"
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="th"><body>{children}</body></html>;
}
