import { LOGIN_INFO_KEY } from '@web/constant';

export function getToken() {
  const localLoginInfo = localStorage.getItem(LOGIN_INFO_KEY);
  if (localLoginInfo) {
    const parsed = JSON.parse(localLoginInfo);
    return parsed.state?.loginInfo?.token?.access_token;
  }
  return null;
}
export function getLocale() {
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/|$)/i);
  if (match) {
    return match[1];
  }
  return 'zh';
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
