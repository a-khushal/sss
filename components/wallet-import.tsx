"use client"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertTriangle } from "lucide-react"
import { splitSecret } from "@/lib/crypto"
import bs58 from "bs58"
import { Keypair } from "@solana/web3.js"

interface WalletImportProps {
  onImportComplete?: (walletData: any) => void
}

export function WalletImport({ onImportComplete }: WalletImportProps) {
  const { publicKey, signMessage } = useWallet()
  const [importing, setImporting] = useState(false)
  const [privateKey, setPrivateKey] = useState("")
  const [shareConfig, setShareConfig] = useState({
    totalShares: 5,
    threshold: 3,
  })

  const handleImportFromConnectedWallet = async () => {
    if (!publicKey || !signMessage) {
      alert("Please connect a wallet first")
      return
    }

    setImporting(true)
    try {
      // Note: We can't actually extract the private key from a connected wallet
      // This is a security feature. We can only sign messages/transactions.
      alert(
        "Connected wallets don't expose private keys for security. Use 'Import from Private Key' instead or create a new wallet.",
      )
    } catch (error) {
      console.error("Import failed:", error)
      alert("Failed to import wallet")
    } finally {
      setImporting(false)
    }
  }

  const handleImportFromPrivateKey = () => {
    if (!privateKey.trim()) {
      alert("Please enter a private key")
      return
    }

    setImporting(true)
    try {
      let secretKey: Uint8Array | null = null

      // --- Base58 try ---
      try {
        secretKey = bs58.decode(privateKey.trim())
      } catch {
        secretKey = null
      }

      // --- Hex fallback ---
      if (!secretKey) {
        const hex = privateKey.trim().replace(/^0x/, "")
        if (hex.length % 2 === 0) {
          const bytes = new Uint8Array(hex.match(/.{2}/g)!.map((b) => Number.parseInt(b, 16)))
          secretKey = bytes
        }
      }

      if (!secretKey || (secretKey.length !== 32 && secretKey.length !== 64)) {
        throw new Error("Key must be 32 or 64 bytes (Base58 or Hex)")
      }

      // Build Keypair
      const keypair = secretKey.length === 64 ? Keypair.fromSecretKey(secretKey) : Keypair.fromSeed(secretKey)

      const base58PrivateKey = secretKey.length === 64 ? bs58.encode(secretKey) : bs58.encode(keypair.secretKey)

      // Generate shares
      const shares = splitSecret(base58PrivateKey, shareConfig.totalShares, shareConfig.threshold)

      // Wallet data
      const walletData = {
        privateKey: base58PrivateKey,
        publicKey: keypair.publicKey.toBase58(),
        address: keypair.publicKey.toBase58(),
        shares,
        config: shareConfig,
        imported: true,
      }

      onImportComplete?.(walletData)
      alert("Wallet imported and shares created successfully!")
    } catch (error: any) {
      console.error("Import failed:", error)
      alert(`Failed to import wallet: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card className="bg-black border-gray-900">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Existing Wallet
        </CardTitle>
        <CardDescription className="text-gray-300">
          Import an existing Solana wallet to create threshold shares
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-red-950 border-red-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            <strong>Security Warning:</strong> Only import wallets in a secure environment. Your private key will be
            processed locally to create shares.
          </AlertDescription>
        </Alert>

        {/* Import from Connected Wallet */}
        <div className="space-y-4">
          <h3 className="font-semibold text-white">Option 1: From Connected Wallet</h3>
          <p className="text-sm text-gray-400">
            Note: Connected wallets don't expose private keys for security. This option is limited.
          </p>
          <Button
            onClick={handleImportFromConnectedWallet}
            disabled={!publicKey || importing}
            variant="outline"
            className="w-full bg-transparent"
          >
            {importing ? "Processing..." : "Import from Connected Wallet"}
          </Button>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <h3 className="font-semibold text-white mb-4">Option 2: From Private Key</h3>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Total Shares</Label>
                <select
                  value={shareConfig.totalShares}
                  onChange={(e) =>
                    setShareConfig((prev) => ({
                      ...prev,
                      totalShares: Number.parseInt(e.target.value),
                      threshold: Math.min(prev.threshold, Number.parseInt(e.target.value)),
                    }))
                  }
                  className="w-full bg-gray-900 border-gray-800 text-white rounded-md px-3 py-2"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} shares
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Recovery Threshold</Label>
                <select
                  value={shareConfig.threshold}
                  onChange={(e) =>
                    setShareConfig((prev) => ({
                      ...prev,
                      threshold: Number.parseInt(e.target.value),
                    }))
                  }
                  className="w-full bg-gray-900 border-gray-800 text-white rounded-md px-3 py-2"
                >
                  {Array.from({ length: shareConfig.totalShares }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} shares needed
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Private Key</Label>
              <Input
                type="password"
                placeholder="Enter your Solana private key (Base58 or Hex format)"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="bg-gray-900 border-gray-800 text-white font-mono"
              />
              <p className="text-xs text-gray-400">
                Supports Base58 format (standard) or Hex format. Your key will be processed locally.
              </p>
            </div>

            <Button
              onClick={handleImportFromPrivateKey}
              disabled={!privateKey.trim() || importing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {importing ? "Creating Shares..." : "Import & Create Shares"}
            </Button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">Supported Formats:</h4>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>
              • Base58 32-byte seed (e.g. <code className="font-mono">3wJS…KD7S</code>)
            </li>
            <li>• Base58 64-byte secret-key (standard Solana export)</li>
            <li>
              • Hex 32 / 64-byte (with or without <code>0x</code> prefix)
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
