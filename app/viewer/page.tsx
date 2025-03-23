"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Code, Send } from "lucide-react";
import { LiveCard } from '@/components/ui/LiveCard';
import { Message } from "@/components/ui/props";
import { fetchComments } from "@/handlers/fetchComments";
import ProblemContent from "@/components/ui/problem-content";

interface ProblemDetail {
  id: string;
  title: string;
  contestId: string;
  problemIndex: string;
  statement: string;
  constraints: string;
  url: string;
  examples: Array<{
    input: string;
    output: string;
  }>;
}

const roomId = 1; // ← 今は固定値。将来的に状態や選択から取得する

export default function ViewerPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentProblem, setCurrentProblem] = useState<{
    id: string;
    title: string;
    url: string;
    contestId: string;
    problemIndex: string;
  } | null>(null);
  
  // 問題詳細の状態
  const [selectedProblem, setSelectedProblem] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState(false);

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
    
    // 問題詳細を取得する関数
    const fetchCurrentProblem = async () => {
      try {
        setLoading(true);
        // 実際の環境では、正しいエンドポイントに変更する必要があります
        const response = await fetch('/api/current-problem');
        
        if (response.ok) {
          const data = await response.json();
          if (data.problem) {
            setSelectedProblem(data.problem);
            setCurrentProblem(data.problem);
          }
        }
      } catch (error) {
        console.error("問題詳細の取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCurrentProblem();
    
    const intervalId = setInterval(fetchCurrentProblem, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
  
    const newMessage = {
      user: "視聴者", // 視聴者として送信
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
            {/* ロゴの代わりにCSSで作成した円形を使用 */}
            <div className="w-10 h-10 bg-[#4D7C4D] rounded-full flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
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
        <div className="lg:col-span-3 space-y-4">
          <LiveCard showUpdateForm={false} showStopStreamingForm={false} />
          
          {/* 問題内容表示コンポーネント */}
          {currentProblem ? (
            <div className="mt-4">
              <ProblemContent 
                problemId={currentProblem.id}
                problemTitle={currentProblem.title}
                problemUrl={currentProblem.url}
                contestId={currentProblem.contestId}
                problemIndex={currentProblem.problemIndex}
              />
            </div>
          ) : (
            <Card className="border-[#B5D267] mt-4">
              <CardHeader className="bg-[#4D7C4D] text-white pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code size={20} />
                  問題内容
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center text-gray-500">
                <p>ドライバーがまだ問題を選択していません。</p>
                <p className="text-sm mt-2">問題が選択されると、ここに内容が表示されます。</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-1">
          <Card className="border-[#B5D267]">
            <CardHeader className="bg-[#4D7C4D] text-white pb-2">
              <CardTitle className="text-lg">コメント</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[500px] pr-4">
                {messages.map((msg, index) => (
                  <div key={index} className="mb-4">
                    <div className="font-semibold text-[#0A5E5C]">{msg.user}</div>
                    <div className="text-sm">{msg.message}</div>
                    {index < messages.length - 1 && <Separator className="mt-2 bg-[#B5D267]" />}
                  </div>
                ))}
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <Input
                  placeholder="メッセージを入力..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="border-[#B5D267] focus-visible:ring-[#4D7C4D]"
                />
                <Button type="submit" size="icon" className="bg-[#FFBA0D] hover:bg-[#e6a700] text-white">
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