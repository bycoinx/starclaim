import Arweave from 'arweave';

// 1. Arweave client oluştur
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { encryptedData, metadata } = body;

    if (!process.env.ARWEAVE_WALLET_KEY) {
      return new Response(JSON.stringify({ error: "Missing ARWEAVE_WALLET_KEY" }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Wallet key'i parse et
    const jwk = JSON.parse(process.env.ARWEAVE_WALLET_KEY);

    // 2. Transaction create (encryptedData is Uint8Array)
    const transaction = await arweave.createTransaction({
      data: Buffer.from(encryptedData)
    }, jwk);

    // 3. Tags ekle
    transaction.addTag('App-Name', 'StarVault');
    transaction.addTag('Content-Type', 'application/octet-stream');
    transaction.addTag('Star-Name', metadata.starName || 'Unnamed Star');
    transaction.addTag('Owner', metadata.owner || 'Anonymous');
    transaction.addTag('Encrypted', 'true');
    transaction.addTag('Timestamp', Date.now().toString());

    // 4. process.env.ARWEAVE_WALLET_KEY ile imzala
    await arweave.transactions.sign(transaction, jwk);

    // 5. Post transaction (with retry logic)
    let response;
    let retries = 3;
    while (retries > 0) {
      response = await arweave.transactions.post(transaction);
      if (response.status === 200 || response.status === 208) break;
      if (response.status === 429) {
         // Rate limit handling
         return new Response(JSON.stringify({ error: "Rate limit reached" }), { 
           status: 429,
           headers: { 'Content-Type': 'application/json' }
         });
      }
      retries--;
      if (retries > 0) await new Promise(r => setTimeout(r, 1000));
    }

    if (response.status !== 200 && response.status !== 208) {
      return new Response(JSON.stringify({ error: `Upload fail with status ${response.status}` }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. Return success
    return new Response(JSON.stringify({
      success: true,
      txId: transaction.id,
      url: `https://arweave.net/${transaction.id}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Arweave upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
