import { ReactNode } from 'react';

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return <div className="h-screen overflow-hidden bg-gray-50">{children}</div>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const paramsData = await params;
  const locale = paramsData.locale;

  return {
    title: `AI Assistant Chat - ${locale.toUpperCase()}`,
    description: 'Chat with your AI assistant',
  };
}
