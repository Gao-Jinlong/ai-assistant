import ky, { Options } from 'ky';
import { LOGIN_INFO_KEY } from '@web/constant';
import { requestUtils } from '@web/utils';
import { merge } from 'es-toolkit';
import { toast } from 'sonner';

function handleAuthorization(request: Request) {
  const accessToken = requestUtils.getToken();
  if (accessToken) {
    request.headers.set('Authorization', `Bearer ${accessToken}`);
  }
}

async function handleUnauthorized(
  request: Request,
  options: Options,
  response: Response,
) {
  if (response.status === 401 || response.status === 403) {
    try {
      // 尝试解析错误信息
      const errorData = await response.clone().json();
      // 清除本地登录信息
      localStorage.removeItem(LOGIN_INFO_KEY);
      // 获取当前语言
      let locale = 'zh';
      try {
        locale = requestUtils.getLocale();
      } catch {
        locale = 'zh';
      }
      toast.error(errorData.message || '认证失败，即将跳转到登录页');
      // 延迟重定向，让用户有机会看到错误信息
      setTimeout(() => {
        window.location.href = `/${locale}/login`;
      }, 1000);

      // 返回错误，让调用方可以捕获
      return Promise.reject(
        new Error(errorData.message || '认证失败，即将跳转到登录页'),
      );
    } catch {
      // 如果解析失败，直接重定向
      localStorage.removeItem(LOGIN_INFO_KEY);
      window.location.href = '/zh/login';
    }
  }
}

const request = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  retry: 0,
  hooks: {
    beforeRequest: [handleAuthorization],
    afterResponse: [handleUnauthorized],
  },
  timeout: 120 * 1000,
});

const get = <T>(url: string, options?: Options) => {
  return request.get<T>(url, options).json();
};

const post = <T>(url: string, options?: Options) => {
  return request.post<T>(url, options).json();
};

const put = <T>(url: string, options?: Options) => {
  return request.put<T>(url, options).json();
};

const del = <T>(url: string, options?: Options) => {
  return request.delete<T>(url, options).json();
};

const patch = <T>(url: string, options?: Options) => {
  return request.patch<T>(url, options).json();
};

const sse = (url: string, options?: Options) => {
  const sseOptions = merge({}, options ?? {});
  return request(url, sseOptions);
};

export { request, get, post, put, del, patch, sse };
