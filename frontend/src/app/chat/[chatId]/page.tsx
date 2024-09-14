import { CardsChat } from '@/components/containers/chat'
import Console from '@/components/containers/console'

const ChatPage = ({ params }: { params: { chatId: string } }) => {
  return (
    <div className="flex">
      <CardsChat chatId={params.chatId} />
      <Console chatId={params.chatId} />
    </div>
  )
}

export default ChatPage
