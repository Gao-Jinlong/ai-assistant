import ky, { Options } from 'ky';
import { LoginResponse } from './user';
import { LOGIN_INFO_KEY } from '@web/constant';
import { getLocale } from '@web/utils';

function handleAuthorization(request: Request) {
  const localLoginInfo = localStorage.getItem(LOGIN_INFO_KEY);
  if (localLoginInfo) {
    const parsed = JSON.parse(localLoginInfo);
    const loginInfo: LoginResponse = parsed.state?.loginInfo;

    const accessToken = loginInfo.token.access_token;
    if (accessToken) {
      request.headers.set('Authorization', `Bearer ${accessToken}`);
    }
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
      locale = getLocale();
    } catch {}
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

export { request, get, post, put, del, patch };
