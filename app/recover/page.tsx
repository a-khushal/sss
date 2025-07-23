"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Copy, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"
import { reconstructSecret, deriveWalletFromPrivateKey } from "@/lib/crypto"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

export default function RecoverWalletPage() {
  const [shares, setShares] = useState(["", ""])
  const [recoveredWallet, setRecoveredWallet] = useState<{
    privateKey: string
    publicKey: string
    address: string
  } | null>(null)
  const [error, setError] = useState("")
  const [isRecovering, setIsRecovering] = useState(false)
  const [requiredThreshold, setRequiredThreshold] = useState(3)
  const [detectedConfig, setDetectedConfig] = useState<{ totalShares: number; threshold: number } | null>(null)
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  const handleShareChange = (index: number, value: string) => {
    const newShares = [...shares]
    newShares[index] = value.trim()
    setShares(newShares)
    setError("")

    // Try to detect configuration from shares
    detectConfigFromShares(newShares)
  }

  const detectConfigFromShares = (currentShares: string[]) => {
    const validShares = currentShares.filter((share) => share.trim() !== "")

    if (validShares.length > 0) {
      const shareNumbers = validShares
        .map((share) => {
          const parts = share.split("-")
          if (parts.length === 2) {
            const num = Number.parseInt(parts[0])
            return !isNaN(num) ? num : null
          }
          return null
        })
        .filter((n) => n !== null) as number[]

      if (shareNumbers.length > 0) {
        const maxShareNumber = Math.max(...shareNumbers)
        const uniqueShares = new Set(shareNumbers).size

        setDetectedConfig({
          totalShares: maxShareNumber,
          threshold: requiredThreshold,
        })

        // Auto-adjust required threshold if we have enough unique shares
        if (uniqueShares >= requiredThreshold) {
          // Configuration looks good
        }
      }
    }
  }

  const handleRecover = async () => {
    setIsRecovering(true)
    setError("")

    try {
      // Filter out empty shares and validate format
      const validShares = shares.filter((share) => share.trim() !== "")

      if (validShares.length < requiredThreshold) {
        throw new Error(`Please provide at least ${requiredThreshold} shares`)
      }

      // Validate share format before attempting reconstruction
      const shareValidation = validShares.map((share, index) => {
        const parts = share.trim().split("-")
        if (parts.length !== 2) {
          throw new Error(`Share ${index + 1} format is invalid. Expected "index-base58data", e.g. 1-4TZS...`)
        }

        const shareIndex = Number.parseInt(parts[0], 10)
        if (!Number.isFinite(shareIndex) || shareIndex < 1) {
          throw new Error(`Share ${index + 1} has an invalid numeric index: "${parts[0]}"`)
        }

        const base58Data = parts[1].trim()

        if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(base58Data)) {
          throw new Error(`Share ${index + 1} contains invalid Base58 characters.`)
        }

        if (base58Data.length < 64) {
          throw new Error(`Share ${index + 1} seems too short. Ensure it was copied fully.`)
        }

        return { index: shareIndex, data: base58Data }
      })

      // Check for duplicate share indices
      const indices = shareValidation.map((s) => s.index)
      const uniqueIndices = new Set(indices)
      if (indices.length !== uniqueIndices.size) {
        throw new Error("Duplicate share indices detected. Each share must have a unique index.")
      }

      console.log("Attempting to reconstruct secret from", validShares.length, "shares")

      // ✅ Use the original validShares strings (e.g. "1-...") for reconstruction
      const privateKey = reconstructSecret(validShares)
      console.log("Secret reconstructed successfully")

      const wallet = deriveWalletFromPrivateKey(privateKey)
      console.log("Wallet derived successfully")

      setRecoveredWallet(wallet)
    } catch (err) {
      console.error("Recovery failed:", err)
      setError(err instanceof Error ? err.message : "Failed to recover wallet")
    } finally {
      setIsRecovering(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const addShareInput = () => {
    if (shares.length < 10) {
      setShares([...shares, ""])
    }
  }

  const removeShareInput = (index: number) => {
    if (shares.length > 2) {
      setShares(shares.filter((_, i) => i !== index))
    }
  }

  const openInSolanaExplorer = (address: string) => {
    window.open(`https://explorer.solana.com/address/${address}?cluster=devnet`, "_blank")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-white mt-4">Recover Solana Wallet</h1>
            <p className="text-gray-100 mt-2">Use your secret shares to reconstruct your Solana wallet</p>
          </div>

          {!recoveredWallet ? (
            <Card className="bg-black border-gray-900">
              <CardHeader>
                <CardTitle>Enter Your Secret Shares</CardTitle>
                <CardDescription>
                  Provide at least {requiredThreshold} secret shares to recover your Solana wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-black border-gray-900">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Notice:</strong> Make sure you're in a secure environment. Your shares will be
                    processed locally and never sent to any server.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <Label className="text-white">Recovery Threshold</Label>
                    <select
                      value={requiredThreshold}
                      onChange={(e) => setRequiredThreshold(Number.parseInt(e.target.value))}
                      className="w-full mt-2 bg-gray-900 border-gray-800 text-white rounded-md px-3 py-2"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} shares needed
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-400 mt-1">
                      Select how many shares are needed to recover this wallet
                    </p>
                    {detectedConfig && (
                      <p className="text-sm text-green-400 mt-1">
                        ✓ Detected: {detectedConfig.threshold}-of-{detectedConfig.totalShares} configuration
                      </p>
                    )}
                  </div>

                  {shares.map((share, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Share {index + 1}</Label>
                        {shares.length > 2 && (
                          <Button variant="outline" size="sm" onClick={() => removeShareInput(index)}>
                            Remove
                          </Button>
                        )}
                      </div>
                      <Textarea
                        placeholder="Paste your secret share here (format: 1-base58data)"
                        value={share}
                        onChange={(e) => handleShareChange(index, e.target.value)}
                        className="crypto-data bg-gray-900 border-gray-800 text-white"
                        rows={3}
                      />
                      {share.trim() && !share.includes("-") && (
                        <p className="text-sm text-red-400">⚠️ Invalid format. Expected: "1-base58data"</p>
                      )}
                    </div>
                  ))}
                </div>

                {shares.length < 10 && (
                  <Button variant="outline" onClick={addShareInput}>
                    Add Another Share
                  </Button>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleRecover}
                  disabled={isRecovering || shares.filter((s) => s.trim()).length < requiredThreshold}
                  className="w-full"
                  size="lg"
                >
                  {isRecovering
                    ? "Recovering Wallet..."
                    : `Recover Wallet (${shares.filter((s) => s.trim()).length}/${requiredThreshold} shares)`}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="bg-black border-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    Solana Wallet Recovered Successfully
                  </CardTitle>
                  <CardDescription>Your Solana wallet has been reconstructed from the provided shares</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-black border-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Success!</strong> Your Solana wallet has been recovered using{" "}
                      {shares.filter((s) => s.trim()).length} shares
                      {detectedConfig &&
                        ` (${detectedConfig.threshold}-of-${detectedConfig.totalShares} configuration)`}
                      . Make sure to securely store your private key and consider creating new shares.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label>Solana Address</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={recoveredWallet.address}
                          readOnly
                          className="bg-gray-900 border-gray-800 text-white crypto-data"
                        />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(recoveredWallet.address)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openInSolanaExplorer(recoveredWallet.address)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Public Key</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={recoveredWallet.publicKey}
                          readOnly
                          className="bg-gray-900 border-gray-800 text-white crypto-data"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(recoveredWallet.publicKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Private Key (Keep Secret!)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type={showPrivateKey ? "text" : "password"}
                          value={recoveredWallet.privateKey}
                          readOnly
                          className="bg-gray-900 border-gray-800 text-white crypto-data"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                        >
                          {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(recoveredWallet.privateKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black border-gray-900">
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Recommended Actions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                      <li>Import your private key into a secure Solana wallet application</li>
                      <li>Consider creating new shares if you suspect any were compromised</li>
                      <li>Verify your wallet balance and transaction history on Solana Explorer</li>
                      <li>Update your backup strategy if needed</li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <Link href="/create" className="flex-1">
                      <Button variant="outline" className="w-full bg-transparent">
                        Create New Shares
                      </Button>
                    </Link>
                    <Link href="/" className="flex-1">
                      <Button className="w-full">Return Home</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
