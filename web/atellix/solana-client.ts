import { PublicKey, Keypair, Connection, Transaction, SystemProgram, clusterApiUrl } from '@solana/web3.js'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { GlowWalletAdapter } from '@solana/wallet-adapter-glow'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { AnchorProvider, Program, BN, setProvider } from '@project-serum/anchor'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAccount, createAssociatedTokenAccountInstruction, TokenAccountNotFoundError } from '@solana/spl-token'
import { create, all } from 'mathjs'
import { v4 as uuidv4, parse as uuidParse } from 'uuid'
import { DateTime } from 'luxon'
import { Buffer } from 'buffer'
import base32 from 'base32.js'
import bs58 from 'bs58'

const SOLANA_NETWORK = 'devnet'
const ANCHOR_IDL = {
    'aqua-dex': require('@/atellix/idl/aqua_dex.json'),
}

export default {
    init () {
        this.math = create(all, {
            number: 'BigNumber',
            precision: 64
        })
        this.program = {}
    },
    updateRegister(data) {
        this.registerFn = data
    },
    importSecretKey(keyStr) {
        var dec = new base32.Decoder({ type: "crockford" })
        var spec = dec.write(keyStr).finalize()
        return Keypair.fromSecretKey(new Uint8Array(spec))
    },
    exportSecretKey(keyPair) {
        var enc = new base32.Encoder({ type: "crockford", lc: true })
        return enc.write(keyPair.secretKey).finalize()
    },
    getWalletAdapters(network) {
        return [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new GlowWalletAdapter(),
        ]
    },
    getWallets() {
        const network = WalletAdapterNetwork.Devnet
        //console.log('Get Wallet Adapters: ' + network)
        let adapters = this.getWalletAdapters(network)
        let wallets = []
        for (var i = 0; i < adapters.length; i++) {
            let adp = adapters[i]
            //console.log(adp.name + ': ' + adp.readyState)
            if (adp.readyState === 'Installed') {
                wallets.push(adp)
                //break
            }
            //console.log(adp)
        }
        return wallets
    },
    getProvider(adapter) {
        let apiUrl = clusterApiUrl(SOLANA_NETWORK)
        let wallet = {
            publicKey: adapter.publicKey,
            signTransaction: function (transaction) { return adapter.signTransaction(transaction) },
            signAllTransactions: function (transactions) { return adapter.signAllTransactions(transactions) }
        }
        let connection = new Connection(apiUrl, { commitment: 'confirmed' })
        let provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
        this.provider = provider
        return provider
    },
    async associatedTokenAddress(walletAddress, tokenMintAddress) {
        const addr = await PublicKey.findProgramAddress(
            [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
            ASSOCIATED_TOKEN_PROGRAM_ID
        )
        const res = { 'pubkey': await addr[0].toString(), 'nonce': addr[1] }
        return res
    },
    async programAddress(inputs, program) {
        const addr = await PublicKey.findProgramAddress(inputs, program)
        const res = { 'pubkey': await addr[0].toString(), 'nonce': addr[1] }
        return res
    },
    loadProgram(programKey) {
        let provider = this.provider
        setProvider(provider)
        if (typeof this.program[programKey] === 'undefined') {
            let programPK = new PublicKey(ANCHOR_IDL[programKey]['metadata']['address'])
            this.program[programKey] = new Program(ANCHOR_IDL[programKey], programPK)
        }
    },
    async getAccountData(programKey, accountType, accountPK) {
        let provider = this.provider
        setProvider(provider)
        let program
        if (typeof this.program[programKey] === 'undefined') {
            program = this.program[programKey]
        } else {
            let programPK = new PublicKey(ANCHOR_IDL[programKey]['metadata']['address'])
            program = new Program(ANCHOR_IDL[programKey], programPK)
            this.program[programKey] = program
        }
        let data = await program.account[accountType].fetch(accountPK)
        return data
    },
    async getLamports(wallet) {
        let walletPK = new PublicKey(wallet)
        let walletInfo = await this.provider.connection.getAccountInfo(walletPK, 'confirmed')
        if (walletInfo && typeof walletInfo['lamports'] !== 'undefined') {
            return walletInfo.lamports
        }
        return Number(0)
    },
    async getTokenBalance(mint, wallet) {
        //console.log(mint, wallet)
        let mintPK = new PublicKey(mint)
        //console.log('mintPK')
        //console.log(mintPK.toBase58())
        let walletPK = new PublicKey(wallet)
        //console.log('walletPK')
        //console.log(walletPK.toBase58())
        let tokenInfo = await this.associatedTokenAddress(walletPK, mintPK)
        let tokenPK = new PublicKey(tokenInfo.pubkey)
        let amount = '0'
        try {
            let tokenAccount = await getAccount(this.provider.connection, tokenPK)
            //console.log('Token Account - Wallet: ' + wallet + ' Mint: ' + mint)
            //console.log(tokenAccount)
            amount = tokenAccount.amount.toString()
        } catch (error) {
            if (error instanceof TokenAccountNotFoundError) {
                // Do nothing
            } else {
                console.error(error)
            }
        }
        return amount
    },
    async hasTokenAccount(ataPK) {
        try {
            await getAccount(this.provider.connection, ataPK)
        } catch (error) {
            return false
        }
        return true
    },
}
