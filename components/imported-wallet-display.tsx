"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import {
  Copy,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  Upload,
  Shield,
  Globe,
  ExternalLink,
  CheckCircle,
  ArrowLeft,
} from "lucide-react"
import { storeToPinata, encryptWalletData } from "@/lib/storage"

interface ImportedWalletDisplayProps {
  walletData: any
  onClear: () => void
}

export function ImportedWalletDisplay({ walletData, onClear }: ImportedWalletDisplayProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showShares, setShowShares] = useState(Array(walletData.shares.length).fill(false))
  const [storagePassword, setStoragePassword] = useState("")
  const [storageResult, setStorageResult] = useState(null)
  const [isStoring, setIsStoring] = useState(false)
  const [storageError, setStorageError] = useState(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadShare = (share: string, index: number) => {
    const blob = new Blob([share], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `imported-solana-wallet-share-${index + 1}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAllShares = () => {
    walletData.shares.forEach((share: string, index: number) => {
      setTimeout(() => downloadShare(share, index), index * 100)
    })
  }

  const toggleShareVisibility = (index: number) => {
    setShowShares((prev) => prev.map((show, i) => (i === index ? !show : show)))
  }

  const openInSolanaExplorer = (address: string) => {
    window.open(`https://explorer.solana.com/address/${address}?cluster=devnet`, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="bg-black border-gray-900">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-400" />
            Wallet Imported Successfully!
          </CardTitle>
          <CardDescription className="text-gray-300">
            Your Solana wallet has been converted to a {walletData.config.threshold}-of-{walletData.config.totalShares}{" "}
            threshold system. Save your shares securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={onClear} variant="outline" className="bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Import Another Wallet
            </Button>
            <Button onClick={downloadAllShares} className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Download All Shares
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Information */}
      <Card className="bg-black border-gray-900">
        <CardHeader>
          <CardTitle className="text-white">Imported Wallet Details</CardTitle>
          <CardDescription className="text-gray-300">
            Your original wallet information and the generated threshold configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-950 border-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-200">
              <strong>Configuration:</strong> {walletData.config.totalShares} total shares created, any{" "}
              {walletData.config.threshold} shares can recover your wallet.
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

      {/* Secret Shares */}
      <Card className="bg-black border-gray-900">
        <CardHeader>
          <CardTitle className="text-white">
            Secret Shares ({walletData.config.threshold}-of-{walletData.config.totalShares} Recovery)
          </CardTitle>
          <CardDescription className="text-gray-300">
            Store each share separately. Any {walletData.config.threshold} shares can recover your imported Solana
            wallet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-black border-gray-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-gray-300">
              <strong>Critical:</strong> Store each share on a different device or location. You need any{" "}
              {walletData.config.threshold} shares to recover your wallet.
            </AlertDescription>
          </Alert>

          {walletData.shares.map((share: string, index: number) => (
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

      <Card className="bg-black border-gray-900">
        <CardHeader>
          <CardTitle className="text-white">Backup Instructions</CardTitle>
          <CardDescription className="text-gray-300">
            Follow these steps to securely store your imported wallet shares
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

          <Alert className="bg-black border-gray-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-gray-300">
              <strong>Remember:</strong> You need any {walletData.config.threshold} out of{" "}
              {walletData.config.totalShares} shares to recover your imported Solana wallet. Test the recovery process
              before relying on it.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
