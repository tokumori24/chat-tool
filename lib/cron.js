const cron = require('node-cron')
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

/**
 * 10分おきにgeneralチャンネルのメッセージを取得する定期処理
 * 実行タイミング: 毎時 00分, 10分, 20分, 30分, 40分, 50分
 */
function startCronJobs() {
  // 10分おきに実行 (cron形式: */10 * * * *)
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log(`[Cron] Running 10-minute check at ${new Date().toISOString()}`)

      // generalチャンネルを取得
      const generalChannel = await prisma.channel.findFirst({
        where: { name: 'general' },
      })

      if (!generalChannel) {
        console.log('[Cron] General channel not found')
        return
      }

      // 現在時刻と10分前の時刻を計算
      const now = new Date()
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)

      // 直近10分間のメッセージを全件取得（件数制限なし）
      // 重要な投稿や文脈を失わないため、全てのメッセージを参照
      const messages = await prisma.chat.findMany({
        where: {
          channelId: generalChannel.id,
          createdAt: {
            gte: tenMinutesAgo,
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
        // take/limitを指定しないことで全件取得
      })

      // メッセージが0件の場合はスキップ（画像生成しない）
      if (messages.length === 0) {
        console.log('[Cron] ⏭️  No messages in the last 10 minutes, skipping illustration generation...')
        return
      }

      // メッセージをテキスト形式に整形
      const summaryText = messages
        .map((msg) => `${msg.user.name || msg.user.email}: ${msg.message}`)
        .join('\n')

      console.log('\n========================================')
      console.log('=== 10-Minute Illustration Summary ===')
      console.log(`Time Range: ${tenMinutesAgo.toISOString()} - ${now.toISOString()}`)
      console.log(`Message Count: ${messages.length}`)
      console.log('Summary Text:')
      console.log(summaryText)
      console.log('======================================')

      // Step 1: プロンプト作成（llama3:8bを使用）
      console.log('[Cron] Step 1: Creating illustration prompt...')
      const promptResponse = await fetch('http://localhost:3000/api/images/prompt-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryText }),
      })

      if (!promptResponse.ok) {
        console.error('[Cron] Failed to create prompt:', await promptResponse.text())
        return
      }

      const promptData = await promptResponse.json()
      const illustrationPrompt = promptData.prompt

      console.log('--------------------------------------')
      console.log('[Cron] 🎨 Generated Illustration Prompt:')
      console.log(illustrationPrompt)
      console.log('--------------------------------------')

      // Step 2: イラスト生成（画像生成モデルを使用）
      console.log('[Cron] Step 2: Generating illustration...')
      const imageResponse = await fetch('http://localhost:3000/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: illustrationPrompt }),
      })

      if (!imageResponse.ok) {
        console.error('[Cron] Failed to generate image:', await imageResponse.text())
        return
      }

      const imageData = await imageResponse.json()
      console.log('[Cron] Image generated successfully!')
      console.log('[Cron] Model used:', imageData.model)
      console.log('[Cron] Image data length:', imageData.image?.length || 0)

      // Step 3: 画像をファイルとして保存
      console.log('[Cron] Step 3: Saving image to output directory...')

      const outputDir = path.join(process.cwd(), 'output')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `illustration_${timestamp}.png`
      const filepath = path.join(outputDir, filename)

      // base64をバッファに変換して保存
      const imageBuffer = Buffer.from(imageData.image, 'base64')
      fs.writeFileSync(filepath, imageBuffer)

      console.log('[Cron] Image saved to:', filepath)
      console.log('========================================\n')

      // Step 4: 画像をgeneralチャンネルに投稿
      console.log('[Cron] Step 4: Posting image to general channel...')

      // システムユーザーを取得または作成
      let systemUser = await prisma.user.findFirst({
        where: { email: 'system@chatbot.local' }
      })

      if (!systemUser) {
        systemUser = await prisma.user.create({
          data: {
            email: 'system@chatbot.local',
            name: 'イラストBot',
            password: 'N/A', // システムユーザーなのでパスワード不要
          }
        })
      }

      // generalチャンネルに画像付きメッセージを投稿
      const imageBase64 = `data:image/png;base64,${imageData.image}`

      const postedMessage = await prisma.chat.create({
        data: {
          userId: systemUser.id,
          channelId: generalChannel.id,
          message: `【10分間のまとめイラスト】`,
          imageUrl: imageBase64,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            }
          }
        }
      })

      console.log('[Cron] Image posted to general channel successfully!')
      console.log('[Cron] Message ID:', postedMessage.id)

      // WebSocketで全クライアントに通知
      if (global.wss) {
        global.wss.clients.forEach((client) => {
          if (client.readyState === 1) { // OPEN
            client.send(JSON.stringify({ type: 'new_message', data: postedMessage }))
          }
        })
        console.log('[Cron] Notified all connected clients via WebSocket')
      }
    } catch (error) {
      console.error('[Cron] Error in 10-minute illustration job:', error)
    }
  })

  console.log('[Cron] Scheduled jobs started - running every 10 minutes')
}

module.exports = { startCronJobs }
