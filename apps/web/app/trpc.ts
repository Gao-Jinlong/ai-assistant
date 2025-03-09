import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@server/trpc/trpc.router';
import { createTRPCNext } from '@trpc/next';
import { getUserPayload } from '@web/contexts/auth-context';

export const trpc = createTRPCNext<AppRouter>({
  config(opts) {
    return {
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_NESTJS_SERVER}/api`,
          async headers() {
            const userPayload = getUserPayload() as {
              token: {
                access_token: string;
              };
            };
            if (userPayload?.token?.access_token) {
              return {
                Authorization: `Bearer ${userPayload.token.access_token}`,
              };
            }
            return {};
          },
        }),
      ],
    };
  },
  ssr: false,
});

// export const trpc = createTRPCNext<AppRouter>({
//   links: [
//     httpBatchLink({
//       url: `${process.env.NEXT_PUBLIC_NESTJS_SERVER}/api`,
//       headers() {
//         const userPayload = AuthService.getUserPayload();
//         // 如果有用户信息，添加 token 到请求头
//         if (userPayload?.token?.access_token) {
//           return {
//             Authorization: `Bearer ${userPayload.token.access_token}`,
//           };
//         }
//         return {};
//       },
//     }),
//   ],
// });
