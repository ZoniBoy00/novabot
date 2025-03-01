import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"

export const data = new SlashCommandBuilder()
  .setName("crypto")
  .setDescription("Get detailed cryptocurrency price information")
  .addStringOption((option) =>
    option
      .setName("coin")
      .setDescription("The cryptocurrency to check (e.g., BTC, ETH, bitcoin, ethereum)")
      .setRequired(true)
      .setAutocomplete(true),
  )

// Common crypto abbreviations mapping
const commonCryptos = {
  btc: "bitcoin",
  eth: "ethereum",
  doge: "dogecoin",
  xrp: "ripple",
  ada: "cardano",
  sol: "solana",
  dot: "polkadot",
  matic: "polygon",
  link: "chainlink",
  uni: "uniswap",
  bnb: "binance coin",
  ltc: "litecoin",
  xlm: "stellar",
  etc: "ethereum classic",
  bch: "bitcoin cash",
  algo: "algorand",
  avax: "avalanche",
  atom: "cosmos",
  near: "near protocol",
  icp: "internet computer",
  fil: "filecoin",
  egld: "elrond",
  hbar: "hedera",
  vet: "vechain",
  xtz: "tezos",
  mana: "decentraland",
  sand: "the sandbox",
  axs: "axie infinity",
  chiliz: "chiliz",
  enj: "enjin coin",
  flow: "flow",
  rose: "oasis network",
  qtum: "qtum",
  iota: "iota",
  ksm: "kusama",
  rvn: "ravencoin",
  zec: "zcash",
  dash: "dash",
  omg: "omisego",
  one: "harmony",
  tfuel: "theta fuel",
  theta: "theta network",
  celo: "celo",
  ar: "arweave",
  grt: "the graph",
  sushi: "sushiswap",
  comp: "compound",
  aave: "aave",
  ftm: "fantom",
  mina: "mina",
  xdc: "xdc network",
  waves: "waves",
  snx: "synthetix",
  lrc: "loopring",
  osmo: "osmosis",
  klay: "klaytn",
  celo: "celo",
  ankr: "ankr",
  crv: "curve dao token",
  ren: "ren",
  bal: "balancer",
  gno: "gnosis",
  dydx: "dydx",
  rly: "rally",
  storj: "storj",
  coti: "coti",
  skl: "skale",
  ardr: "ardor",
  audio: "audius",
  chz: "chiliz",
  fet: "fetch.ai",
  kda: "kadena",
  hnt: "helium",
  dgb: "digibyte",
  sys: "syscoin",
  celo: "celo",
  kava: "kava",
  xch: "chia",
  flux: "flux",
  xyo: "xyo",
  rlc: "iexec rlc",
  celo: "celo",
  band: "band protocol",
  bnt: "bancor",
  scrt: "secret",
  perp: "perpetual protocol",
  rsr: "reserve rights",
  cvc: "civic",
  pols: "polkastarter",
  ewt: "energy web token",
  uos: "ultra",
  tribe: "tribe",
  hbar: "hedera hashgraph",
  mlm: "melon",
  renbtc: "renbtc",
  alice: "my neighbor alice",
  mask: "mask network",
  lqty: "liquity",
  ckb: "nervos network",
  ksm: "kusama",
  dpi: "defi pulse index",
  rsr: "reserve rights",
  woo: "woo network",
  dydx: "dydx",
  cvx: "convex finance",
  yfi: "yearn finance",
  mir: "mirror protocol",
  keep: "keep network",
  vra: "verasity",
  rbn: "ribbon finance",
  auction: "bounce finance",
  fxs: "frax share",
  op: "optimism",
  metis: "metis dao",
  spell: "spell token",
  xhv: "haven protocol",
  grin: "grin",
  beam: "beam",
  mv: "gensoKishi metaverse",
  ilv: "illuvium",
  ant: "aragon",
  ocean: "ocean protocol",
  ark: "ark",
  dent: "dent",
  boba: "boba network",
  mlk: "milk alliance",
  orai: "orai chain",
  ctsi: "cartesi",
  trb: "tellor",
  people: "constitutiondao",
  efi: "efinity",
  xrt: "robonomics network",
  alcx: "alchemix",
  hns: "handshake",
  akro: "akropolis",
  aergo: "aergo",
  hifi: "hifi finance",
  front: "frontier",
  jst: "just",
  loom: "loom network",
  mxc: "mxc",
  nucypher: "nucypher",
  nu: "nucypher",
  orbs: "orbs",
  reef: "reef finance",
  safe: "safe",
  super: "superfarm",
  xt: "xt.com",
  ygg: "yield guild games",
  dydx: "dydx",
  ren: "ren",
  pnt: "pnetwork",
  mdt: "measurable data token",
  nmr: "numeraire",
  wxt: "wirex token",
  cell: "cellframe",
  bond: "barnbridge",
  iq: "everipedia",
  usdt: "tether",
  usdc: "usd coin",
  busd: "binance usd",
  dai: "dai",
  frax: "frax",
  ust: "terrausd",
  pax: "paxos standard",
  tusd: "trueusd"
};

export async function autocomplete(interaction) {
  const focusedValue = interaction.options.getFocused().toLowerCase()

  try {
    // Fetch coin list from CoinGecko if not cached
    if (!interaction.client.cryptoList) {
      const response = await fetch("https://api.coingecko.com/api/v3/coins/list")
      if (!response.ok) throw new Error("Failed to fetch coin list")
      interaction.client.cryptoList = await response.json()
    }

    let choices = []

    // First, check common abbreviations
    if (focusedValue) {
      for (const [abbr, fullName] of Object.entries(commonCryptos)) {
        if (abbr.includes(focusedValue) || fullName.includes(focusedValue)) {
          choices.push({ name: `${abbr.toUpperCase()} (${fullName})`, value: fullName })
        }
      }
    }

    // Then search through all coins
    const coinMatches = interaction.client.cryptoList
      .filter(
        (coin) => coin.symbol.toLowerCase().includes(focusedValue) || coin.name.toLowerCase().includes(focusedValue),
      )
      .slice(0, 25 - choices.length) // Leave room for common cryptos
      .map((coin) => ({
        name: `${coin.symbol.toUpperCase()} (${coin.name})`,
        value: coin.id,
      }))

    choices = [...choices, ...coinMatches].slice(0, 25)

    await interaction.respond(choices)
  } catch (error) {
    console.error("Error in autocomplete:", error)
    await interaction.respond([{ name: "Error fetching coins", value: "error" }])
  }
}

export async function execute(interaction) {
  await interaction.deferReply()

  let coin = interaction.options.getString("coin").toLowerCase()

  // Check if it's a common abbreviation
  if (commonCryptos[coin]) {
    coin = commonCryptos[coin]
  }

  try {
    // Fetch detailed coin data
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coin}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
    )

    if (!response.ok) {
      if (response.status === 404) {
        return interaction.editReply({
          content: "Cryptocurrency not found. Please check the name/symbol and try again.",
          flags: ["Ephemeral"],
        })
      }
      throw new Error("Failed to fetch crypto data")
    }

    const data = await response.json()

    // Format prices with appropriate decimal places
    const formatPrice = (price) => {
      if (price < 0.01) return price.toFixed(8)
      if (price < 1) return price.toFixed(4)
      if (price < 100) return price.toFixed(2)
      return price.toLocaleString(undefined, { maximumFractionDigits: 2 })
    }

    // Format large numbers
    const formatLargeNumber = (num) => {
      if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
      if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
      if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
      return `$${num.toLocaleString()}`
    }

    const priceData = data.market_data
    const changeColor = priceData.price_change_percentage_24h >= 0 ? "#00FF00" : "#FF0000"

    const cryptoEmbed = createEmbed({
      title: `${data.name} (${data.symbol.toUpperCase()}) Price Info`,
      url: `https://www.coingecko.com/en/coins/${data.id}`,
      description: data.description?.en?.split(". ")[0] || "No description available.",
      thumbnail: data.image?.large,
      fields: [
        {
          name: "💵 Current Price",
          value: `USD: $${formatPrice(priceData.current_price.usd)}
EUR: €${formatPrice(priceData.current_price.eur)}
GBP: £${formatPrice(priceData.current_price.gbp)}`,
          inline: true,
        },
        {
          name: "📊 24h Change",
          value: `Price: ${priceData.price_change_percentage_24h.toFixed(2)}%
High: $${formatPrice(priceData.high_24h.usd)}
Low: $${formatPrice(priceData.low_24h.usd)}`,
          inline: true,
        },
        {
          name: "📈 Market Stats",
          value: `Market Cap: ${formatLargeNumber(priceData.market_cap.usd)}
Volume 24h: ${formatLargeNumber(priceData.total_volume.usd)}
Market Cap Rank: #${data.market_cap_rank || "N/A"}`,
          inline: true,
        },
        {
          name: "💰 Market Supply",
          value: `Circulating: ${formatLargeNumber(priceData.circulating_supply)}
Total: ${priceData.total_supply ? formatLargeNumber(priceData.total_supply) : "∞"}
Max: ${priceData.max_supply ? formatLargeNumber(priceData.max_supply) : "∞"}`,
          inline: true,
        },
        {
          name: "📅 Price Change",
          value: `7d: ${priceData.price_change_percentage_7d?.toFixed(2)}%
30d: ${priceData.price_change_percentage_30d?.toFixed(2)}%
1y: ${priceData.price_change_percentage_1y?.toFixed(2)}%`,
          inline: true,
        },
        {
          name: "🏆 All-Time",
          value: `ATH: $${formatPrice(priceData.ath.usd)}
ATL: $${formatPrice(priceData.atl.usd)}
ATH Date: <t:${Math.floor(new Date(priceData.ath_date.usd).getTime() / 1000)}:R>`,
          inline: true,
        },
      ],
      color: changeColor,
      footer: {
        text: `Last Updated: ${new Date(data.last_updated).toLocaleString()} • Data by CoinGecko`,
        icon_url: "https://www.coingecko.com/favicon.ico",
      },
    })

    await interaction.editReply({ embeds: [cryptoEmbed] })
  } catch (error) {
    console.error("Error fetching crypto data:", error)
    await interaction.editReply({
      content:
        "There was an error fetching cryptocurrency data. The API might be rate limited. Please try again later.",
      flags: ["Ephemeral"],
    })
  }
}

