import ky, { Options } from 'ky';
import { LOGIN_INFO_KEY } from '@web/constant';
import { requestUtils } from '@web/utils';
import { merge } from 'es-toolkit';

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
    // 清除本地登录信息
    localStorage.removeItem(LOGIN_INFO_KEY);
    // 获取当前语言
    let locale = 'zh';
    try {
      locale = requestUtils.getLocale();
    } catch {
      locale = 'zh';
    }
    // 跳转到登录页
    window.location.href = `/${locale}/login`;
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
