import httpx
import asyncio
from stellar_sdk import Keypair, Server, TransactionBuilder, Network, Asset
from stellar_sdk.exceptions import NotFoundError, BadRequestError

HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org"
FRIENDBOT_URL = "https://friendbot.stellar.org"
server = Server(HORIZON_TESTNET_URL)


async def create_testnet_account() -> dict:
    keypair = Keypair.random()
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{FRIENDBOT_URL}/?addr={keypair.public_key}")
        resp.raise_for_status()
    return {
        "public_key": keypair.public_key,
        "secret": keypair.secret,
    }


async def get_account_balances(account_id: str) -> dict:
    try:
        # server.accounts().account_id(...).call() is blocking; run in thread
        account = await asyncio.to_thread(lambda: server.accounts().account_id(account_id).call())
    except NotFoundError:
        raise ValueError("Stellar account not found")
    return {
        balance["asset_type"]: balance["balance"]
        for balance in account.get("balances", [])
    }


async def send_xlm(source_secret: str, destination: str, amount: str, memo: str = "") -> dict:
    source_keypair = Keypair.from_secret(source_secret)
    # load_account is blocking in this SDK; run in thread
    source_account = await asyncio.to_thread(lambda: server.load_account(source_keypair.public_key))
    if destination == source_keypair.public_key:
        raise ValueError("Cannot send XLM to the same account")

    try:
        await asyncio.to_thread(lambda: server.accounts().account_id(destination).call())
    except NotFoundError:
        raise ValueError("Destination account does not exist on the network")

    tx_builder = TransactionBuilder(
        source_account=source_account,
        network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
        base_fee=100,
    ).append_payment_op(destination=destination, amount=str(amount), asset=Asset.native())

    if memo:
        tx_builder.add_text_memo(memo[:28])

    transaction = tx_builder.set_timeout(30).build()
    transaction.sign(source_keypair)
    # submit_transaction is blocking; run in thread
    response = await asyncio.to_thread(lambda: server.submit_transaction(transaction))
    return response
