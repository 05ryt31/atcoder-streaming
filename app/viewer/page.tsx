"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Code, Send } from "lucide-react";
import { LiveCard } from '@/components/ui/LiveCard'; // LiveCard コンポーネントをインポート
import { Message } from "@/components/ui/props";
import { fetchComments } from "@/handlers/fetchComments";

const roomId = 1; // ← 今は固定値。将来的に状態や選択から取得する

export default function ViewerPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchComments('https://mobpro-api.taketo-u.net/messages/1');
      if (result && Array.isArray(result)) {
        setMessages(result);
      } else {
        console.warn("コメントデータの取得に失敗したか、形式が不正です: ", result);
      }
    };
    fetchData();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim()) return;
    
      const newMessage = {
        user: "ドライバー", // ← 必要なら state にしてもOK
        message: message,
      };
    
      try {
        const res = await fetch(`https://mobpro-api.taketo-u.net/messages/make/${roomId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newMessage),
        });
    
        if (!res.ok) {
          throw new Error("コメント送信に失敗しました");
        }
    
        const savedMessage = await res.json();
    
        setMessages([...messages, {
          user: savedMessage.user,
          message: savedMessage.message
        }]);
    
        setMessage(""); // 入力欄をクリア
    
      } catch (error) {
        console.error("コメントの送信に失敗しました:", error);
        setMessages([...messages, {
          user: "システム",
          message: "コメントの送信に失敗しました。"
        }]);
      }
    };

  const switchToDriver = () => {
    router.push("/driver");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#e9f2e9]">
      <header className="bg-white border-b border-[#4D7C4D] p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="アンタオサウルス"
              width={40}
              height={40}
              className="rounded-full"
            />
            <h1 className="text-xl font-bold text-[#4D7C4D]">
              アンタオサウルス
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={switchToDriver}
            className="border-[#4D7C4D] text-[#4D7C4D] hover:bg-[#e9f2e9] hover:text-[#3a5e3a]"
          >
            ドライバーに切替
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <LiveCard showUpdateForm={false} showStopStreamingForm={false} />
        </div>

        <div className="space-y-4 lg:col-span-1">
          <Card className="border-[#B5D267]">
            <CardHeader className="bg-[#4D7C4D] text-white pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code size={20} />
                問題文
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[200px] overflow-y-auto">
                <h3 className="font-bold text-[#0A5E5C]">ABC123 - C問題</h3>
                <p className="mt-2 text-sm">
                  N個の都市があり、都市iとi+1の間には道路があります。各都市から次の都市へ移動するのにかかる時間はTiです。
                  都市1からスタートして都市Nに到達するまでの最短時間を求めてください。
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#B5D267]">
            <CardHeader className="bg-[#4D7C4D] text-white pb-2">
              <CardTitle className="text-lg">コメント</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[300px] pr-4">
                {messages.map((msg, index) => (
                  <div key={index} className="mb-4" style={{ whiteSpace: 'pre-line' }}>
                    <div className="font-semibold text-[#0A5E5C]">
                      {msg.user}
                    </div>
                    <div className="text-sm">{msg.message}</div>
                    {index < messages.length - 1 && (
                      <Separator className="mt-2 bg-[#B5D267]" />
                    )}
                  </div>
                ))}
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <Textarea
                  placeholder="メッセージを入力..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="border-[#B5D267] focus-visible:ring-[#4D7C4D]"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-[#FFBA0D] hover:bg-[#e6a700] text-white"
                >
                  <Send size={18} />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-white border-t border-[#4D7C4D] p-4 text-center text-sm text-[#4D7C4D]">
        アンタオサウルス © 2025
      </footer>
    </div>
  );
}
