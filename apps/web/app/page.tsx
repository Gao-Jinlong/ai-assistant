'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`mb-4 p-4 rounded ${
            message.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
          }`}
        >
          <div className="font-bold mb-1">
            {message.role === 'user' ? '你：' : 'AI：'}
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      ))}

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 w-full max-w-md p-4 bg-white border-t"
      >
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 border border-gray-300 rounded"
            value={input}
            onChange={handleInputChange}
            placeholder="输入消息..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            发送
          </button>
        </div>
      </form>
    </div>
  );
}
