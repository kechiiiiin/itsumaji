export async function notifyDiscord(webhookUrl: string, message: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  })

  if (!response.ok) {
    throw new Error(`Discord notify failed: ${response.status} ${response.statusText}`)
  }
}

export function formatError(e: unknown): string {
  return e instanceof Error
    ? `${e.name}: ${e.message}\n${e.stack ?? ""}`
    : String(e)
}

export async function notifyError(webhookUrl: string, context: string, e: unknown): Promise<void> {
  await notifyDiscord(webhookUrl, `❌ ${context}\n\`\`\`\n${formatError(e)}\n\`\`\``)
}

async function tryNotify(fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (e) {
    // 通知の失敗でジョブ本体を落とさない（ログだけ残す）
    console.error(`Discord notification failed: ${formatError(e)}`)
  }
}

export async function runWithNotify(
  name: string,
  fn: () => Promise<void>,
  webhookUrl: string
): Promise<void> {
  try {
    await fn()
    await tryNotify(() => notifyDiscord(webhookUrl, `✅ ${name} が完了しました`))
  } catch (e) {
    console.error(`${name} failed: ${formatError(e)}`)
    await tryNotify(() => notifyError(webhookUrl, `${name} が失敗しました`, e))
  }
}
