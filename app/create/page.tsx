"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Download, Eye, EyeOff, AlertTriangle, Upload, Shield, Globe, ExternalLink, Wallet } from "lucide-react"
import { generateSolanaWallet, splitSecret } from "@/lib/crypto"
import { storeToPinata, encryptWalletData } from "@/lib/storage"
import Link from "next/link"

export default function CreateWalletPage() {
  const [step, setStep] = useState(1)
  const [walletData, setWalletData] = useState(null)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showShares, setShowShares] = useState(Array(10).fill(false))
  const [shareConfig, setShareConfig] = useState({
    totalShares: 7,
    threshold: 5,
  })
  const [storagePassword, setStoragePassword] = useState("")
  const [storageResult, setStorageResult] = useState(null)
  const [isStoring, setIsStoring] = useState(false)
  const [storageError, setStorageError] = useState(null)

  const handleGenerateWallet = () => {
    const wallet = generateSolanaWallet()
    const shares = splitSecret(wallet.privateKey, shareConfig.totalShares, shareConfig.threshold)

    setWalletData({
      ...wallet,
      shares,
      config: shareConfig,
    })
    setStep(2)
    setShowShares(Array(shareConfig.totalShares).fill(false))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const downloadShare = (share, index) => {
    const blob = new Blob([share], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `solana-wallet-share-${index + 1}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleShareVisibility = (index) => {
    setShowShares((prev) => prev.map((show, i) => (i === index ? !show : show)))
  }

  const handleStoreToPinata = async () => {
    if (!storagePassword) {
      alert("Please enter a password for encryption")
      return
    }

    setIsStoring(true)
    setStorageError(null)

    try {
      const encryptedData = encryptWalletData(walletData, storagePassword)
      const result = await storeToPinata(encryptedData)
      setStorageResult(result)
    } catch (error) {
      console.error("Pinata storage failed:", error)
      setStorageError(error.message)
    } finally {
      setIsStoring(false)
    }
  }

  const openInSolanaExplorer = (address) => {
    window.open(`https://explorer.solana.com/address/${address}?cluster=devnet`, "_blank")
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-white mt-4">Create New Solana Wallet</h1>
            <p className="text-gray-100 mt-2">Generate a new threshold Solana wallet with Shamir's Secret Sharing</p>
          </div>

          {step === 1 && (
            <Card className="bg-black border-gray-900">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Step 1: Generate Solana Wallet
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Create a new Solana keypair and split it into shares.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-black border-gray-900">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-gray-300">
                    <strong>Security Warning:</strong> Make sure you're in a secure environment. Your Solana private key
                    will be generated locally and never sent to any server.
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white">Total Number of Shares</Label>
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
                      <p className="text-sm text-gray-400">How many total shares to create</p>
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
                      <p className="text-sm text-gray-400">Minimum shares needed for recovery</p>
                    </div>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Configuration Summary:</h4>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• {shareConfig.totalShares} total shares will be created</li>
                      <li>• Any {shareConfig.threshold} shares can recover your wallet</li>
                      <li>• You can lose up to {shareConfig.totalShares - shareConfig.threshold} shares safely</li>
                      <li>• Higher threshold = more security, lower threshold = easier recovery</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-white">What will be created:</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                      <li>A new Solana keypair (Ed25519 curve)</li>
                      <li>Corresponding Solana public key and address</li>
                      <li>{shareConfig.totalShares} secret shares using Shamir's Secret Sharing</li>
                      <li>Any {shareConfig.threshold} shares can recover your Solana wallet</li>
                    </ul>
                  </div>
                </div>

                <Button onClick={handleGenerateWallet} className="w-full" size="lg">
                  Generate Secure Solana Wallet
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && walletData && (
            <div className="space-y-6">
              <Card className="bg-black border-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Step 2: Solana Wallet Generated Successfully</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your Solana wallet has been created with {walletData.config.totalShares} shares (
                    {walletData.config.threshold}-of-{walletData.config.totalShares} recovery). Save your shares
                    securely on different devices.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-black border-gray-900">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-gray-300">
                      <strong>Critical:</strong> Store each share on a different device or location. You need any{" "}
                      {walletData.config.threshold} shares to recover your Solana wallet. If you lose{" "}
                      {walletData.config.totalShares - walletData.config.threshold + 1} or more shares, your wallet
                      cannot be recovered.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Solana Address</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          className="bg-gray-900 border-gray-800 text-white crypto-data"
                          value={walletData.address}
                          readOnly
                        />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(walletData.address)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => openInSolanaExplorer(walletData.address)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Public Key</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          className="bg-gray-900 border-gray-800 text-white crypto-data"
                          value={walletData.publicKey}
                          readOnly
                        />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(walletData.publicKey)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Private Key (Keep Secret!)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          className="bg-gray-900 border-gray-800 text-white crypto-data"
                          type={showPrivateKey ? "text" : "password"}
                          value={walletData.privateKey}
                          readOnly
                        />
                        <Button variant="outline" size="icon" onClick={() => setShowPrivateKey(!showPrivateKey)}>
                          {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(walletData.privateKey)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black border-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">
                    Secret Shares ({walletData.config.threshold}-of-{walletData.config.totalShares} Recovery)
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Store each share separately. Any {walletData.config.threshold} shares can recover your Solana
                    wallet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {walletData.shares.map((share, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-900 border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-semibold text-white">Share {index + 1}</Label>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => toggleShareVisibility(index)}>
                            {showShares[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(share)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => downloadShare(share, index)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={showShares[index] ? share : "••••••••••••••••••••••••••••••••"}
                        readOnly
                        className="crypto-data bg-gray-900 border-gray-800 text-white"
                        rows={3}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pinata IPFS Storage */}
              <Card className="bg-black border-gray-900">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    IPFS Storage via Pinata
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Store encrypted Solana wallet data to IPFS using Pinata's reliable pinning service.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-red-950 border-red-800">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-red-200">
                      <strong>Security Notice:</strong> Data will be encrypted with your password before storage. Only
                      store if you understand the risks. Never store unencrypted private keys on public networks.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Encryption Password</Label>
                      <Input
                        type="password"
                        placeholder="Enter a strong password for encryption"
                        value={storagePassword}
                        onChange={(e) => setStoragePassword(e.target.value)}
                        className="bg-gray-900 border-gray-800 text-white mt-1"
                      />
                      <p className="text-sm text-gray-400 mt-1">
                        This password will encrypt your Solana wallet data before storage. Keep it safe!
                      </p>
                    </div>

                    <div className="max-w-md mx-auto">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center">
                            <Upload className="h-6 w-6 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white text-lg">Pinata IPFS</h4>
                            <p className="text-sm text-gray-400">Reliable IPFS pinning service</p>
                          </div>
                        </div>
                        <Button
                          onClick={handleStoreToPinata}
                          disabled={!storagePassword || isStoring}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          size="lg"
                        >
                          {isStoring ? "Storing to IPFS..." : "Store Solana Wallet to IPFS"}
                        </Button>
                        {storageResult && (
                          <div className="bg-gray-900 border border-gray-800 rounded p-4">
                            <p className="text-lg text-green-400 mb-3">✓ Successfully stored to IPFS!</p>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm text-gray-400">IPFS Hash:</p>
                                <p className="text-sm text-white font-mono break-all">{storageResult.hash}</p>
                              </div>
                              <a
                                href={storageResult.gateway}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                              >
                                View on Pinata Gateway <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        )}
                        {storageError && (
                          <div className="bg-red-950 border border-red-800 rounded p-4">
                            <p className="text-lg text-red-400 mb-2">❌ Storage failed</p>
                            <p className="text-sm text-red-300">{storageError}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">What gets stored on IPFS:</h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        <li>• Encrypted Solana wallet configuration (shares count, threshold)</li>
                        <li>• Encrypted Solana public key and address (for verification)</li>
                        <li>• Encrypted secret shares (NOT the private key directly)</li>
                        <li>• Timestamp and metadata</li>
                      </ul>
                      <p className="text-xs text-gray-400 mt-2">
                        Solana private key is never stored directly - only encrypted shares that require your threshold
                        to reconstruct.
                      </p>
                    </div>

                    <Alert className="bg-yellow-950 border-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-yellow-200">
                        <strong>Setup Required:</strong> You need to set NEXT_PUBLIC_PINATA_API_KEY and
                        NEXT_PUBLIC_PINATA_SECRET_KEY environment variables to use Pinata storage.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button onClick={() => setStep(3)} className="flex-1">
                  Continue to Backup Instructions
                </Button>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Finish Later
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {step === 3 && walletData && (
            <Card className="bg-black border-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Step 3: Backup Instructions</CardTitle>
                <CardDescription className="text-gray-300">
                  Follow these steps to securely store your Solana wallet shares
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white">Recommended Backup Strategy:</h3>

                  <div className="grid gap-4">
                    {Array.from({ length: walletData.config.totalShares }, (_, i) => (
                      <div
                        key={i}
                        className={`border-l-4 pl-4 ${
                          i === 0
                            ? "border-blue-500"
                            : i === 1
                              ? "border-green-500"
                              : i === 2
                                ? "border-purple-500"
                                : i === 3
                                  ? "border-yellow-500"
                                  : i === 4
                                    ? "border-red-500"
                                    : "border-gray-500"
                        }`}
                      >
                        <h4 className="font-semibold text-white">
                          Share {i + 1}:{" "}
                          {i === 0
                            ? "Primary Device"
                            : i === 1
                              ? "Secondary Device"
                              : i === 2
                                ? "Offline Backup"
                                : i === 3
                                  ? "Cloud Storage"
                                  : i === 4
                                    ? "Hardware Backup"
                                    : `Backup Location ${i + 1}`}
                        </h4>
                        <p className="text-sm text-gray-300">
                          {i === 0
                            ? "Store on your main device in a secure location (encrypted storage, password manager)"
                            : i === 1
                              ? "Store on a different device (phone, tablet, or another computer)"
                              : i === 2
                                ? "Print or write down and store in a secure physical location (safe, bank deposit box)"
                                : i === 3
                                  ? "Store in encrypted cloud storage with strong authentication"
                                  : i === 4
                                    ? "Store on a hardware device (USB drive, hardware wallet)"
                                    : "Store in a secure, separate location from other shares"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {storageResult && (
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">IPFS Backup:</h4>
                    <div className="mb-2">
                      <p className="text-sm text-purple-400">✓ Pinata: {storageResult.hash.substring(0, 20)}...</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Remember your encryption password - you'll need it to decrypt the stored Solana wallet data.
                    </p>
                  </div>
                )}

                <Alert className="bg-black border-gray-900">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-gray-300">
                    <strong>Remember:</strong> You need any {walletData.config.threshold} out of{" "}
                    {walletData.config.totalShares} shares to recover your Solana wallet. Test the recovery process with
                    your shares before storing large amounts of SOL.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Link href="/recover" className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      Test Recovery
                    </Button>
                  </Link>
                  <Link href="/" className="flex-1">
                    <Button className="w-full">Complete Setup</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
