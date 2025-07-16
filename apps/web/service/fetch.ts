import ky, { Options } from 'ky';

const request = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  retry: 0,
  hooks: {
    beforeRequest: [],
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
