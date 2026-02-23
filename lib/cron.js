const cron = require('node-cron')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * 5分おきにgeneralチャンネルのメッセージを取得する定期処理
 * 実行タイミング: 毎時 00分, 05分, 10分, 15分, 20分, 25分...
 */
function startCronJobs() {
  // 5分おきに実行 (cron形式: */5 * * * *)
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log(`[Cron] Running 5-minute check at ${new Date().toISOString()}`)

      // generalチャンネルを取得
      const generalChannel = await prisma.channel.findFirst({
        where: { name: 'general' },
      })

      if (!generalChannel) {
        console.log('[Cron] General channel not found')
        return
      }

      // 現在時刻と5分前の時刻を計算
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

      // 直近5分間のメッセージを取得
      const messages = await prisma.chat.findMany({
        where: {
          channelId: generalChannel.id,
          createdAt: {
            gte: fiveMinutesAgo,
            lte: now,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      // メッセージが0件の場合はスキップ
      if (messages.length === 0) {
        console.log('[Cron] No messages in the last 5 minutes, skipping...')
        return
      }

      // メッセージをテキスト形式に整形
      const summaryText = messages
        .map((msg) => `${msg.user.name || msg.user.email}: ${msg.message}`)
        .join('\n')

      console.log('=== 5-Minute Illustration Summary ===')
      console.log(`Time Range: ${fiveMinutesAgo.toISOString()} - ${now.toISOString()}`)
      console.log(`Message Count: ${messages.length}`)
      console.log('Summary Text:')
      console.log(summaryText)
      console.log('======================================')

      // TODO: ここでOllamaにリクエストを送信してイラスト生成
      // 現在はログ出力のみ
    } catch (error) {
      console.error('[Cron] Error in 5-minute illustration job:', error)
    }
  })

  console.log('[Cron] Scheduled jobs started - running every 5 minutes')
}

module.exports = { startCronJobs }
