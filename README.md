# Solana Threshold Wallet

A secure, self-custody Solana wallet for the Solana blockchain, built with Next.js. It uses Shamir's Secret Sharing to split your private key into multiple shares for enhanced security and flexible recovery. Supports all major Solana wallets and optional encrypted backup to IPFS via Pinata.

## Features
- Connect and use any major Solana wallet
- Create a new wallet and split the private key into shares
- Recover your wallet using a threshold of shares
- Optional encrypted backup to IPFS (Pinata)

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

2. **(Optional) Enable IPFS backup:**
   Create a `.env.local` file in the project root and add:
   ```
   NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
   NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
   ```

3. **Start the app:**
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser. 