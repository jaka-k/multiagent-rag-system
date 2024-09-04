import { CardsChat } from '@/components/containers/chat'

const ChatPage = ({ chatId }: { chatId: string }) => {
  return (
    <div>
      <CardsChat chatId={chatId} />
    </div>
  )
}

export default ChatPage
