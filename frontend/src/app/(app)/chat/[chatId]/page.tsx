import { Chat } from '@components/containers/chat'
import Console from '@components/containers/console'
import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import { logger } from '@lib/logger.ts'
import { ChatData } from '@mytypes/types'

const ChatPage = async ({
  params
}: {
  params: Promise<{ chatId: string }>
}) => {
  const { chatId } = await params
  const response = await fetchWithAuth<ChatData>(`/api/chat/${chatId}`)

  if (!response.ok) {
    logger.error('Error while fetching chat data')
  }

  return (
    <div className="main">
      <div className="viewbody">
        <div className="content" style={{ background: 'var(--panel)' }}>
          <Chat chatData={response.data} />
        </div>
        <div
          className="w-[350px] md:w-[440px] h-full flex-shrink-0"
          style={{ borderLeft: '1px solid var(--hair)' }}
        >
          <Console chatId={chatId} areaId={response.data.areaId} />
        </div>
      </div>
    </div>
  )
}

export default ChatPage
