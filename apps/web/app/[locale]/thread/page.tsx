'use client';

import { Allotment } from 'allotment';

export default function ChatPage() {
  return (
    <div className="flex h-screen w-full flex-col">
      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        <Allotment>
          <Allotment.Pane minSize={280} maxSize={400} preferredSize={320}>
            <div className="h-full border-r bg-gray-50"></div>
          </Allotment.Pane>

          {/* 右侧对话内容 */}
          <Allotment.Pane>
            <div className="flex h-full flex-col bg-white"></div>
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}
