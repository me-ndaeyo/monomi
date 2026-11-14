export const MCP_CONFIG = `{
  "mcpServers": {
    "monomi": {
      "command": "pnpm",
      "args": ["--dir", "/path/to/monomi", "mcp"],
      "env": {
        "MONOMI_API_URL": "https://<your-monomi-url>",
        "DEMO_AGENT_ACCOUNT_ID": "<your-agent>.testnet",
        "DEMO_AGENT_PRIVATE_KEY": "ed25519:<key for that account>",
        "AGENT_PER_JOB_CAP_USD": "25",
        "AGENT_DAILY_CAP_USD": "50"
      }
    }
  }
}`
