"use client"

import { useState, useEffect } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Copy, ExternalLink, RefreshCw } from "lucide-react"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"

interface WalletConnectionProps {
  onWalletConnect?: (publicKey: string) => void
}

export function WalletConnection({ onWalletConnect }: WalletConnectionProps) {
  const { connection } = useConnection()
  const { publicKey, connected, wallet } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchBalance = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error("Failed to fetch balance:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
      onWalletConnect?.(publicKey.toString())
    }
  }, [connected, publicKey])

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString())
    }
  }

  const openInSolanaExplorer = () => {
    if (publicKey) {
      window.open(`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`, "_blank")
    }
  }

  return (
    <Card className="bg-black border-gray-900">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Solana Wallet Connection
        </CardTitle>
        <CardDescription className="text-gray-300">
          Connect any Solana wallet to interact with the threshold wallet system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connected ? (
          <div className="space-y-4">
            <Alert className="bg-blue-950 border-blue-800">
              <AlertDescription className="text-blue-200">
                Connect your Solana wallet to view balances, sign transactions, and interact with the Solana ecosystem.
                Supports all major Solana wallets.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col items-center space-y-4">
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !font-semibold !px-6 !py-3 !text-white !border-none" />
              <p className="text-sm text-gray-400 text-center">
                Supports Phantom, Solflare, Glow, Exodus, Ledger, and 25+ other wallets
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-green-950 border-green-800">
              <AlertDescription className="text-green-200">
                ✓ {wallet?.adapter.name} wallet connected successfully!
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Connected Wallet:</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-2 flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2">
                    {wallet?.adapter.icon && (
                      <img
                        src={wallet.adapter.icon || "/placeholder.svg"}
                        alt={wallet.adapter.name}
                        className="w-5 h-5"
                      />
                    )}
                    <span className="text-white font-semibold">{wallet?.adapter.name}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Connected Address:</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-white font-mono">
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyAddress}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={openInSolanaExplorer}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">Balance:</label>
                  <Button variant="ghost" size="sm" onClick={fetchBalance} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <p className="text-lg font-semibold text-white">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <WalletDisconnectButton className="!bg-gray-700 hover:!bg-gray-600 !rounded-lg !font-semibold !px-4 !py-2 !text-white !border-none flex-1" />
              <Button onClick={fetchBalance} variant="outline" disabled={loading}>
                {loading ? "Refreshing..." : "Refresh Balance"}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">Supported Wallets:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-300">
            <div>• Phantom</div>
            <div>• Solflare</div>
            <div>• Glow</div>
            <div>• Exodus</div>
            <div>• Trust Wallet</div>
            <div>• Ledger</div>
            <div>• Coin98</div>
            <div>• Math Wallet</div>
            <div>• Slope</div>
            <div>• Nightly</div>
            <div>• Nufi</div>
            <div>• And 15+ more...</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
