"use client"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, ShieldCheck } from "lucide-react"
import { splitSecret } from "@/lib/crypto"
import bs58 from "bs58"
import { Keypair } from "@solana/web3.js"
import { encryptShareWithGuardianPubkey, storeToPinata } from "@/lib/storage"

interface WalletImportProps {
  onImportComplete?: (walletData: any) => void
}

export function WalletImport({ onImportComplete }: WalletImportProps) {
  const { publicKey } = useWallet()
  const [step, setStep] = useState<"import" | "encrypt">("import")
  const [importing, setImporting] = useState(false)
  const [privateKey, setPrivateKey] = useState("")
  const [shareConfig, setShareConfig] = useState({ totalShares: 5, threshold: 3 })
  const [shares, setShares] = useState<string[]>([])
  const [guardianPubkeys, setGuardianPubkeys] = useState<string[]>(Array(5).fill(""))
  const [walletInfo, setWalletInfo] = useState<{ base58PrivateKey: string; publicKey: string } | null>(null)

  const updateGuardianKey = (index: number, value: string) => {
    const updated = [...guardianPubkeys]
    updated[index] = value
    setGuardianPubkeys(updated)
  }

  const handleImportFromPrivateKey = () => {
    if (!privateKey.trim()) {
      alert("Please enter a private key")
      return
    }

    setImporting(true)
    try {
      let secretKey: Uint8Array | null = null

      try {
        secretKey = bs58.decode(privateKey.trim())
      } catch {
        const hex = privateKey.trim().replace(/^0x/, "")
        if (hex.length % 2 === 0) {
          secretKey = new Uint8Array(hex.match(/.{2}/g)!.map((b) => Number.parseInt(b, 16)))
        }
      }

      if (!secretKey || (secretKey.length !== 32 && secretKey.length !== 64)) {
        throw new Error("Key must be 32 or 64 bytes (Base58 or Hex)")
      }

      const keypair =
        secretKey.length === 64
          ? Keypair.fromSecretKey(secretKey)
          : Keypair.fromSeed(secretKey)

      const base58PrivateKey =
        secretKey.length === 64
          ? bs58.encode(secretKey)
          : bs58.encode(keypair.secretKey)

      const split = splitSecret(base58PrivateKey, shareConfig.totalShares, shareConfig.threshold)

      setShares(split)
      setGuardianPubkeys(Array(shareConfig.totalShares).fill(""))
      setWalletInfo({
        base58PrivateKey,
        publicKey: keypair.publicKey.toBase58(),
      })
      setStep("encrypt")
    } catch (error: any) {
      alert(`Failed to import wallet: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const handleEncryptionAndUpload = async () => {
    if (guardianPubkeys.some((pk) => !pk.trim())) {
      alert("Enter all guardian public keys")
      return
    }

    try {
      const encryptedAndStored = await Promise.all(
        shares.map(async (share, idx) => {
          const encrypted = encryptShareWithGuardianPubkey(share, guardianPubkeys[idx])
          const { hash } = await storeToPinata(encrypted)
          return hash
        })
      )

      const result = {
        shares: encryptedAndStored,
        config: {
          threshold: shareConfig.threshold,
          totalShares: shareConfig.totalShares,
        },
        guardianPubkeys,
        address: walletInfo?.publicKey,
        publicKey: walletInfo?.publicKey,
        privateKey: walletInfo?.base58PrivateKey,
      }

      onImportComplete?.(result)
      alert("Shares encrypted and uploaded to IPFS")
    } catch (e) {
      console.error(e)
      alert("Encryption or upload failed")
    }
  }

  return (
    <Card className="bg-black border-gray-900">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {step === "import" ? <Upload className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          {step === "import" ? "Import Wallet" : "Encrypt & Upload Shares"}
        </CardTitle>
        <CardDescription className="text-gray-300">
          {step === "import"
            ? "Import an existing Solana wallet and generate secret shares"
            : "Assign guardian public keys for encrypted upload"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === "import" ? (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Total Shares</Label>
                <select
                  value={shareConfig.totalShares}
                  onChange={(e) => {
                    const newTotal = parseInt(e.target.value)
                    setShareConfig((prev) => ({
                      totalShares: newTotal,
                      threshold: Math.min(prev.threshold, newTotal),
                    }))
                  }}
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
                      threshold: Math.min(parseInt(e.target.value), prev.totalShares),
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
                placeholder="Enter your Solana private key (Base58 or Hex)"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="bg-gray-900 border-gray-800 text-white font-mono"
              />
            </div>

            <Button
              onClick={handleImportFromPrivateKey}
              disabled={!privateKey.trim() || importing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {importing ? "Processing..." : "Import Wallet & Generate Shares"}
            </Button>

            {shares.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="text-white">Generated Shares</Label>
                {shares.map((share, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800 text-white p-2 rounded-md font-mono text-sm break-all"
                  >
                    Share {idx + 1}: {share}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-white">Guardian Public Keys</Label>
              <div className="space-y-2">
                {shares.map((_, i) => (
                  <Input
                    key={i}
                    type="text"
                    placeholder={`Guardian #${i + 1} public key`}
                    value={guardianPubkeys[i] || ""}
                    onChange={(e) => updateGuardianKey(i, e.target.value)}
                    className="bg-gray-900 border-gray-800 text-white font-mono"
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleEncryptionAndUpload}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Encrypt & Upload Shares
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
