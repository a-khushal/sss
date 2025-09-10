import nacl from "tweetnacl"
import bs58 from "bs58"

// Existing encryption for whole wallet data (simplified XOR - keep as is)
export function encryptWalletData(walletData: any, password: string): string {
  // Simplified encryption for demo - in production use proper encryption like AES-256
  const dataToEncrypt = {
    config: walletData.config,
    address: walletData.address,
    publicKey: walletData.publicKey,
    shares: walletData.shares,
    timestamp: Date.now(),
    // Note: We don't include the private key directly for security
  }

  const jsonString = JSON.stringify(dataToEncrypt)

  // Simple XOR encryption for demo (use proper encryption in production)
  let encrypted = ""
  for (let i = 0; i < jsonString.length; i++) {
    const charCode = jsonString.charCodeAt(i) ^ password.charCodeAt(i % password.length)
    encrypted += String.fromCharCode(charCode)
  }

  return btoa(encrypted) // Base64 encode
}

export function decryptWalletData(encryptedData: string, password: string): any {
  try {
    const encrypted = atob(encryptedData) // Base64 decode

    // Simple XOR decryption for demo
    let decrypted = ""
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ password.charCodeAt(i % password.length)
      decrypted += String.fromCharCode(charCode)
    }

    return JSON.parse(decrypted)
  } catch (error) {
    throw new Error("Failed to decrypt data - incorrect password or corrupted data")
  }
}

// New: Encrypt a single share with guardian's public key using tweetnacl box
// Returns Base58 encoded string of nonce + encrypted message
export function encryptShareWithGuardianPubkey(share: string, guardianPubkeyBase58: string): string {
  // Convert guardian public key from base58 to Uint8Array
  const guardianPubkey = bs58.decode(guardianPubkeyBase58)

  // Generate ephemeral keypair for sender (one-time)
  const ephemeralKeypair = nacl.box.keyPair()

  // Convert share string to Uint8Array
  const shareBytes = new TextEncoder().encode(share)

  // Generate nonce (24 bytes random)
  const nonce = nacl.randomBytes(nacl.box.nonceLength)

  // Encrypt the share with guardian's public key and ephemeral secret key
  const encrypted = nacl.box(shareBytes, nonce, guardianPubkey, ephemeralKeypair.secretKey)

  // Compose payload = ephemeral public key (32 bytes) + nonce (24 bytes) + encrypted message
  const payload = new Uint8Array(
    ephemeralKeypair.publicKey.length + nonce.length + encrypted.length
  )
  payload.set(ephemeralKeypair.publicKey, 0)
  payload.set(nonce, ephemeralKeypair.publicKey.length)
  payload.set(encrypted, ephemeralKeypair.publicKey.length + nonce.length)

  // Return base58 string of the payload
  return bs58.encode(payload)
}

// Optional: Decrypt share with own secret key and ephemeral public key included in payload
// Assumes payload is base58 string containing [ephemeralPubKey (32) | nonce (24) | encryptedData]
// `recipientSecretKey` is Uint8Array of 32 bytes (your private key)
export function decryptShareWithSecretKey(payloadBase58: string, recipientSecretKey: Uint8Array): string {
  const payload = bs58.decode(payloadBase58)

  const ephemeralPubKey = payload.slice(0, 32)
  const nonce = payload.slice(32, 32 + 24)
  const encrypted = payload.slice(32 + 24)

  const decrypted = nacl.box.open(encrypted, nonce, ephemeralPubKey, recipientSecretKey)

  if (!decrypted) {
    throw new Error("Failed to decrypt share - invalid key or corrupted data")
  }

  return new TextDecoder().decode(decrypted)
}

export async function storeToPinata(
  encryptedData: string,
  apiKey?: string,
  secretKey?: string,
): Promise<{ hash: string; gateway: string }> {
  try {
    const PINATA_API_KEY = apiKey || process.env.NEXT_PUBLIC_PINATA_API_KEY || ""
    const PINATA_SECRET_KEY = secretKey || process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || ""

    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error("Pinata API keys missing. Provide them in env vars or via the UI.")
    }

    // Create form data for Pinata
    const formData = new FormData()
    const blob = new Blob([encryptedData], { type: "application/json" })
    formData.append("file", blob, "wallet-backup.json")

    // Add metadata
    const metadata = JSON.stringify({
      name: `Threshold Wallet Backup - ${new Date().toISOString()}`,
      keyvalues: {
        type: "threshold-wallet-backup",
        timestamp: Date.now().toString(),
        encrypted: "true",
      },
    })
    formData.append("pinataMetadata", metadata)

    // Add options
    const options = JSON.stringify({
      cidVersion: 1,
    })
    formData.append("pinataOptions", options)

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`)
    }

    const result = await response.json()
    const hash = result.IpfsHash
    const gateway = `https://gateway.pinata.cloud/ipfs/${hash}`

    console.log("Successfully stored to Pinata:", { hash, gateway })
    return { hash, gateway }
  } catch (error) {
    console.error("Pinata storage error:", error)
    throw new Error(`Failed to store to Pinata: ${(error as any).message}`)
  }
}

export async function retrieveFromPinata(hash: string): Promise<string> {
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`)

    if (!response.ok) {
      throw new Error(`Failed to retrieve from Pinata: ${response.statusText}`)
    }

    return await response.text()
  } catch (error) {
    console.error("Pinata retrieval error:", error)
    throw new Error(`Failed to retrieve from Pinata: ${(error as any).message}`)
  }
}
