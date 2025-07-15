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

const get = (url: string, options?: Options) => {
  return request.get(url, options).json();
};

const post = (url: string, options?: Options) => {
  return request.post(url, options).json();
};

const put = (url: string, options?: Options) => {
  return request.put(url, options).json();
};

const del = (url: string, options?: Options) => {
  return request.delete(url, options).json();
};

const patch = (url: string, options?: Options) => {
  return request.patch(url, options).json();
};

export { request, get, post, put, del, patch };
