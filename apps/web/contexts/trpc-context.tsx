import { trpc } from '@web/app/trpc';
import { ReactNode } from 'react';

type TrpcProviderProps = {
  children: ReactNode;
};

const InnerTrpcProvider = ({ children }: TrpcProviderProps) => {
  return children;
};

const TrpcProvider = trpc.withTRPC(
  InnerTrpcProvider,
) as React.ComponentType<TrpcProviderProps>;

export { TrpcProvider };
