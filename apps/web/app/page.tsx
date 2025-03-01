'use client';

import { useCallback, useState } from 'react';
import { trpc } from './trpc';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data: Parameters<typeof trpc.user.create.mutate>[0] = {
      email,
      password,
      name: username,
      avatar: 'https://example.com/avatar.png',
    };

    const createUser = await trpc.user.create.mutate(data);

    setLoading(false);
  }, []);

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">用户注册</h1>

      {message && (
        <div
          className={`p-3 mb-4 rounded ${
            message.includes('失败')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block mb-1">
            用户名
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block mb-1">
            电子邮箱
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-1">
            密码
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
    </div>
  );
}
