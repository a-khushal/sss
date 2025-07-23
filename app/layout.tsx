import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SolanaWalletProvider } from "@/components/wallet-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Solana Threshold Wallet - Secure Self-Custody with Shamir's Secret Sharing",
  description: "A secure self-custody Solana wallet using Shamir's Secret Sharing for enhanced security and recovery",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  )
}
