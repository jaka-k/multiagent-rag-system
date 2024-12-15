import { CardsChat } from '@/components/containers/chat'
import Console from '@/components/containers/console'
import { fetchWithAuth } from '@lib/fetchers/fetchWithAuth'
import { ChatData, FlashcardQueue } from '@types'

const ChatPage = async ({ params }: { params: { chatId: string } }) => {
  const response = await fetchWithAuth<ChatData>(
    `/api/v1/chat/${params.chatId}`
  )
  if (!response.ok) {
    // TODO: Log
    console.log('Error while fetching chat data')
  }



  return (
    <div className="flex">
      <CardsChat chatData={response.data} />
      <Console
        chatId={params.chatId}
        areaId={response.data.area_id}
      />
    </div>
  )
}

export default ChatPage
