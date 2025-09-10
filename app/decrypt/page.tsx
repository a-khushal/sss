"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Download, Eye, EyeOff, AlertTriangle, Globe, ExternalLink, Lock, Unlock } from "lucide-react"
import { retrieveFromPinata, decryptWalletData } from "@/lib/storage"
import Link from "next/link"

interface ShareConfig {
  totalShares: number;
  threshold: number;
}

interface DecryptedWallet {
  address: string;
  publicKey: string;
  timestamp: number | string;
  shares?: string[];
  config?: ShareConfig;
}

export default function DecryptWalletPage() {
  const [step, setStep] = useState(1)
  const [ipfsHash, setIpfsHash] = useState("")
  const [decryptionPassword, setDecryptionPassword] = useState("")
  const [encryptedData, setEncryptedData] = useState("")
  const [decryptedWallet, setDecryptedWallet] = useState<DecryptedWallet | null>(null)
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [error, setError] = useState("")
  const [showShares, setShowShares] = useState<boolean[]>([])

  const handleRetrieveFromIPFS = async () => {
    if (!ipfsHash.trim()) {
      setError("Please enter an IPFS hash")
      return
    }

    setIsRetrieving(true)
    setError("")

    try {
      const cleanHash = ipfsHash.trim().replace(/^https?:\/\/[^/]+\/ipfs\//, "")

      const data = await retrieveFromPinata(cleanHash)
      setEncryptedData(data)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retrieve data from IPFS")
    } finally {
      setIsRetrieving(false)
    }
  }

  const handleDecryptData = async () => {
    if (!decryptionPassword.trim()) {
      setError("Please enter the decryption password")
      return
    }

    setIsDecrypting(true)
    setError("")

    try {
      const decrypted = decryptWalletData(encryptedData, decryptionPassword)
      setDecryptedWallet(decrypted)
      setShowShares(Array(decrypted.shares?.length || 0).fill(false))
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decrypt data - check your password")
    } finally {
      setIsDecrypting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadShare = (share: string, index: number) => {
    const blob = new Blob([share], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `decrypted-wallet-share-${index + 1}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAllShares = () => {
    if (decryptedWallet?.shares) {
      decryptedWallet.shares.forEach((share: string, index: number) => {
        setTimeout(() => downloadShare(share, index), index * 100)
      })
    }
  }

  const toggleShareVisibility = (index: number) => {
    setShowShares((prev) => prev.map((show, i) => (i === index ? !show : show)))
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
            <h1 className="text-3xl font-bold text-white mt-4">Decrypt Wallet from IPFS</h1>
            <p className="text-gray-100 mt-2">Retrieve and decrypt your wallet backup from IPFS storage</p>
          </div>

          {step === 1 && (
            <Card className="bg-black border-gray-900">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Step 1: Retrieve from IPFS
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Enter your IPFS hash to retrieve your encrypted wallet backup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-blue-950 border-blue-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-blue-200">
                    <strong>Info:</strong> You'll need the IPFS hash that was provided when you stored your wallet
                    backup. This retrieves the encrypted data - you'll still need your password to decrypt it.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white">IPFS Hash or Gateway URL</Label>
                    <Input
                      placeholder="QmXXXXXX... or https://gateway.pinata.cloud/ipfs/QmXXXXXX..."
                      value={ipfsHash}
                      onChange={(e) => setIpfsHash(e.target.value)}
                      className="bg-gray-900 border-gray-800 text-white font-mono mt-1"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Enter the IPFS hash or full gateway URL from when you stored your wallet
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleRetrieveFromIPFS}
                    disabled={isRetrieving || !ipfsHash.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isRetrieving ? "Retrieving from IPFS..." : "Retrieve Encrypted Data"}
                  </Button>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Supported Formats:</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• IPFS Hash: QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</li>
                    <li>• Pinata Gateway: https://gateway.pinata.cloud/ipfs/QmXXXXXX...</li>
                    <li>• Any IPFS Gateway URL</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="bg-black border-gray-900">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Step 2: Decrypt Data
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Enter your password to decrypt the retrieved wallet data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-green-950 border-green-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-green-200">
                    <strong>Success!</strong> Encrypted data retrieved from IPFS. Now enter your decryption password.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Retrieved Data Preview</Label>
                    <Textarea
                      value={encryptedData.substring(0, 200) + "..."}
                      readOnly
                      className="bg-gray-900 border-gray-800 text-white font-mono"
                      rows={3}
                    />
                    <p className="text-sm text-gray-400 mt-1">Encrypted data size: {encryptedData.length} characters</p>
                  </div>

                  <div>
                    <Label className="text-white">Decryption Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter the password you used when encrypting"
                      value={decryptionPassword}
                      onChange={(e) => setDecryptionPassword(e.target.value)}
                      className="bg-gray-900 border-gray-800 text-white mt-1"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      This is the same password you entered when storing the wallet to IPFS
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-4">
                    <Button onClick={() => setStep(1)} variant="outline" className="flex-1 bg-transparent">
                      Back to Retrieve
                    </Button>
                    <Button
                      onClick={handleDecryptData}
                      disabled={isDecrypting || !decryptionPassword.trim()}
                      className="flex-1"
                    >
                      {isDecrypting ? "Decrypting..." : "Decrypt Wallet Data"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && decryptedWallet && (
            <div className="space-y-6">
              <Card className="bg-black border-gray-900">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-green-400" />
                    Wallet Successfully Decrypted!
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Your wallet backup has been decrypted and is ready to use
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-green-950 border-green-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-green-200">
                      <strong>Success!</strong> Wallet decrypted with {decryptedWallet.config?.threshold}-of-
                      {decryptedWallet.config?.totalShares} threshold configuration. Stored on:{" "}
                      {new Date(decryptedWallet.timestamp).toLocaleString()}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Solana Address</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          className="bg-gray-900 border-gray-800 text-white crypto-data"
                          value={decryptedWallet.address}
                          readOnly
                        />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(decryptedWallet.address)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openInSolanaExplorer(decryptedWallet.address)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Public Key</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          className="bg-gray-900 border-gray-800 text-white crypto-data"
                          value={decryptedWallet.publicKey}
                          readOnly
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(decryptedWallet.publicKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={downloadAllShares} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Download className="h-4 w-4 mr-2" />
                      Download All Shares
                    </Button>
                    <Button onClick={() => setStep(1)} variant="outline" className="flex-1 bg-transparent">
                      Decrypt Another
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {decryptedWallet.shares && (
                <Card className="bg-black border-gray-900">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Decrypted Secret Shares ({decryptedWallet.config?.threshold}-of-
                      {decryptedWallet.config?.totalShares} Recovery)
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Your threshold shares have been successfully decrypted from IPFS storage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {decryptedWallet.shares.map((share, index) => (
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
              )}

              <Card className="bg-black border-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-white">What you can do now:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                      <li>Download and securely store your decrypted shares</li>
                      <li>Use the shares to recover your wallet if needed</li>
                      <li>Verify your wallet address and public key</li>
                      <li>Create new encrypted backups if desired</li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <Link href="/recover" className="flex-1">
                      <Button variant="outline" className="w-full bg-transparent">
                        Test Recovery
                      </Button>
                    </Link>
                    <Link href="/create" className="flex-1">
                      <Button variant="outline" className="w-full bg-transparent">
                        Create New Backup
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
