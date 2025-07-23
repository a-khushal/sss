"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Key, Lock } from "lucide-react"
import { WalletConnection } from "@/components/wallet-connection"
import { WalletImport } from "@/components/wallet-import"
import { ImportedWalletDisplay } from "@/components/imported-wallet-display"
import Link from "next/link"

export default function HomePage() {
  const [importedWallet, setImportedWallet] = useState(null)

  const handleImportComplete = (walletData: any) => {
    setImportedWallet(walletData)
  }

  const handleClearImport = () => {
    setImportedWallet(null)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Solana Threshold Wallet</h1>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
            Secure self-custody Solana wallet using Shamir's Secret Sharing. Split your private key across multiple
            devices for enhanced security and recovery. Supports all major Solana wallets.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/create">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Create New Wallet
              </Button>
            </Link>
            <Link href="/recover">
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-100 hover:bg-gray-800 hover:text-white bg-transparent"
              >
                Recover Wallet
              </Button>
            </Link>
            <Link href="/decrypt">
              <Button
                size="lg"
                variant="outline"
                className="border-purple-600 text-purple-100 hover:bg-purple-800 hover:text-white bg-transparent"
              >
                Decrypt from IPFS
              </Button>
            </Link>
          </div>
        </div>

        {/* Wallet Connection Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <WalletConnection />
        </div>

        {/* Show imported wallet display or import form */}
        <div className="max-w-2xl mx-auto mb-16">
          {importedWallet ? (
            <ImportedWalletDisplay walletData={importedWallet} onClear={handleClearImport} />
          ) : (
            <WalletImport onImportComplete={handleImportComplete} />
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-black border-gray-900">
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 mx-auto text-blue-400 mb-2" />
              <CardTitle className="text-lg text-white">Universal Wallet Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Works with all major Solana wallets: Phantom, Solflare, Glow, Exodus, Ledger, and 25+ others.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black border-gray-900">
            <CardHeader className="text-center">
              <Users className="w-12 h-12 mx-auto text-green-400 mb-2" />
              <CardTitle className="text-lg text-white">Threshold Recovery</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Recover your Solana wallet with your chosen threshold of shares. High-security configuration with
                flexible recovery options.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black border-gray-900">
            <CardHeader className="text-center">
              <Key className="w-12 h-12 mx-auto text-purple-400 mb-2" />
              <CardTitle className="text-lg text-white">Solana Native</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Built specifically for Solana. Generate proper Solana keypairs and interact with the Solana ecosystem.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black border-gray-900">
            <CardHeader className="text-center">
              <Lock className="w-12 h-12 mx-auto text-red-400 mb-2" />
              <CardTitle className="text-lg text-white">Cryptographic Proof</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Built on Shamir's Secret Sharing, a mathematically proven method for secure key distribution.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-4xl mx-auto bg-black border-gray-900">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-white">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-400">1</span>
                </div>
                <h3 className="font-semibold mb-2 text-white">Connect Any Wallet</h3>
                <p className="text-sm text-gray-300">
                  Connect your existing Solana wallet or create a new one. Supports all major wallet providers.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-400">2</span>
                </div>
                <h3 className="font-semibold mb-2 text-white">Create Threshold Shares</h3>
                <p className="text-sm text-gray-300">
                  Split your wallet into multiple shares using Shamir's Secret Sharing for enhanced security.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-400">3</span>
                </div>
                <h3 className="font-semibold mb-2 text-white">Secure Recovery</h3>
                <p className="text-sm text-gray-300">
                  Use your threshold number of shares to reconstruct your wallet and access your SOL and tokens.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
