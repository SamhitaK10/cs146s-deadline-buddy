import { localDev } from "eve/channels/auth";
import { mcpChannel } from "eve/channels/mcp";

// Publishes Deadline Buddy as an MCP server at /eve/v1/mcp, so a coding agent
// (Claude Code, Cursor) can ask it about deadlines mid-session.
//
// - agent_* tools hand a question to the whole agent.
// - tools: true also exposes list_deadlines, week_schedule and
//   get_assignment_spec for direct calls. All three are read-only.
//
// localDev() only admits callers under `eve dev` and rejects every request in
// production. Swap in a production auth mode before you rely on it deployed.
export default mcpChannel({
  auth: localDev(),
  tools: true,
});
