/**
 * 루트 레이아웃 (Root Layout)
 * - 모든 페이지에 공통으로 적용되는 최상위 레이아웃
 * - HTML lang="ko", 다크 모드 기본 적용
 * - Header(상단 네비게이션)와 Footer(하단 푸터)를 모든 페이지에 감싸줌
 * - Inter(본문용), Geist Mono(코드용) 폰트 설정
 * - SEO 메타데이터 (타이틀, 설명) 정의
 */
import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// 본문용 폰트 (가변 폰트)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// 코드/모노스페이스용 폰트
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO 메타데이터 - 브라우저 탭 제목 및 검색엔진 설명
export const metadata: Metadata = {
  title: "GDRMCL | GDRMCL Challenge List",
  description: "GDRMCL - GDROOM CHALLENGE LIST",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]`}
      >
        <Header />
        <main className="flex-grow flex flex-col pb-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
