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
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <div className="flex-1 flex flex-col">
        <Chat chatData={response.data} />
      </div>
      <div className="w-[350px] md:w-[470px] h-full flex-shrink-0">
        <Console chatId={chatId} areaId={response.data.areaId} />
      </div>
    </div>
  )
}

export default ChatPage
