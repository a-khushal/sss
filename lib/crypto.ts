import { Keypair } from "@solana/web3.js"
import bs58 from "bs58"
import * as sss from "shamirs-secret-sharing"

export function generateSolanaWallet() {
  const keypair = Keypair.generate()
  const privateKey = bs58.encode(keypair.secretKey)
  const publicKey = keypair.publicKey.toBase58()
  const address = publicKey

  return {
    privateKey,
    publicKey,
    address,
    keypair,
  }
}

export function deriveWalletFromPrivateKey(privateKey: string) {
  try {
    const secretKey = bs58.decode(privateKey)
    if (secretKey.length !== 64) {
      throw new Error("Invalid Solana private key length - must be 64 bytes")
    }

    const keypair = Keypair.fromSecretKey(secretKey)
    const publicKey = keypair.publicKey.toBase58()
    const address = publicKey

    return {
      privateKey,
      publicKey,
      address,
      keypair,
    }
  } catch (error) {
    throw new Error(`Invalid Solana private key format: ${(error as any).message}`)
  }
}

export function splitSecret(secretBase58: string, totalShares: number, threshold: number): string[] {
  const secretBytes = bs58.decode(secretBase58)
  const shares = sss.split(secretBytes, { shares: totalShares, threshold })

  return shares.map((buf, index) => `${index + 1}-${bs58.encode(buf)}`)
}

export function reconstructSecret(shares: string[]): string {
  if (shares.length < 2) throw new Error("At least 2 shares required")

  const shareBuffers = shares.map((s, idx) => {
    const parts = s.trim().split("-")
    if (parts.length !== 2) {
      throw new Error(`Share ${idx + 1} format is invalid. Expected "index-base58data"`)
    }

    return bs58.decode(parts[1])
  })

  const secretBytes = sss.combine(shareBuffers)
  return bs58.encode(secretBytes)
}

// Alias for compatibility
export function generateWallet() {
  return generateSolanaWallet()
}
