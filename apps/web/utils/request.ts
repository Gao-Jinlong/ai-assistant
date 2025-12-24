import { LOGIN_INFO_KEY } from '@web/constant';
import { ResponseWrapper } from '@web/service';
import { isHTTPError, isKyError } from 'ky';

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

export async function getErrorMessage(error: unknown): Promise<string> {
  if (isHTTPError(error)) {
    const result: ResponseWrapper<{
      message: string;
    }> = await error.response.json();
    return result.message;
  }
  return error instanceof Error ? error.message : String(error);
}
