import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@server/trpc/trpc.router';
import { AuthService } from '@web/lib/auth';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_NESTJS_SERVER}/api`,
      headers() {
        const userPayload = AuthService.getUserPayload();
        // 如果有用户信息，添加 token 到请求头
        if (userPayload?.token?.access_token) {
          return {
            Authorization: `Bearer ${userPayload.token.access_token}`,
          };
        }
        return {};
      },
    }),
  ],
});
