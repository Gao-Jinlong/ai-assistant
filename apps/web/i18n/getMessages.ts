export async function getMessages(locale: string) {
  try {
    return (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`无法加载语言文件 ${locale}`, error);
    // 回退到默认语言
    return (await import(`../messages/en.json`)).default;
  }
}
