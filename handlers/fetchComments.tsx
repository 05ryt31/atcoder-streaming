import { Message } from "@/components/ui/props";

export const fetchComments = async (url: string) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('ネットワークエラーが発生しました。');
      }
      const result = await response.json();
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("エラーメッセージ：", error.message);
      } else {
        console.log('予期しないエラーが発生しました');
      }
    // エラーが発生した場合はダミーデータを返す
    const dummyData: { messages: Message[] } = {
        messages: [
            { user: 'ダミーユーザー', message: 'ダミーメッセージ' },
            { user: 'ダミーユーザー', message: 'ダミーメッセージ' },
            { user: 'ダミーユーザー', message: 'ダミーメッセージ' },
        ],
    };
    return dummyData;
    }
  };
  