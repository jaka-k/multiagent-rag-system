import { Chat } from '@components/containers/chat'
import ChatSidebar from '@components/containers/chat-sidebar'
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
        <ChatSidebar chatId={chatId} areaId={response.data.areaId} />
      </div>
    </div>
  )
}

export default ChatPage
