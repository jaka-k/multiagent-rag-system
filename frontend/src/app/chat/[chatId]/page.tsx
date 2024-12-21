import { Chat } from '@/components/containers/chat'
import Console from '@/components/containers/console'
import { fetchWithAuth } from '@lib/fetchers/fetchWithAuth'
import { ChatData } from '@types'

const ChatPage = async ({ params }: { params: { chatId: string } }) => {
  const response = await fetchWithAuth<ChatData>(`/api/chat/${params.chatId}`)
  if (!response.ok) {
    // TODO: Log
    console.log('Error while fetching chat data')
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <div className="flex-1 flex flex-col">
        <Chat chatData={response.data} />
      </div>
      <div className="w-[350px] md:w-[470px] h-full flex-shrink-0">
        <Console chatId={params.chatId} areaId={response.data.area_id} />
      </div>
    </div>
  )
}

export default ChatPage
