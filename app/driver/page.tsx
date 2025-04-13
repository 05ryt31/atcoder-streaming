"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Send, Users } from "lucide-react";
import { LiveCard } from "@/components/ui/LiveCard";
import type { Message } from "@/components/ui/props";
import { fetchComments } from "@/handlers/fetchComments";
import ProblemContent from "@/components/ui/problem-content";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import CommentCard from "@/components/ui/CommentCard";

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

const roomId = 1;
const currentUserId = 1;

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
  const [selectedProblem, setSelectedProblem] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  
  // ユニークな視聴者数の表示用
  const uniqueUsers = new Set(messages.map((item) => item.user));
  const newUniqueUsers = [...uniqueUsers];

  // コメントデータ取得：GET リクエスト URL の末尾にスラッシュと ?user_id= を付与
  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchComments(`https://mobpro-api.taketo-u.net/messages/${roomId}/?user_id=${currentUserId}`);
      if (result && Array.isArray(result)) {
        setMessages(result);
      } else {
        console.warn("コメントデータの取得に失敗または形式不正:", result);
      }
    };
    fetchData();
    
    // 問題詳細取得（適宜 API 実装に合わせ調整）
    const fetchCurrentProblem = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/current-problem");
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
  
  // コメント送信処理
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const currentUser = localStorage.getItem("username") || "匿名";
    const newMsg = { user: currentUser, message: message };
    
    try {
      const res = await fetch(`https://mobpro-api.taketo-u.net/messages/make/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });
      if (!res.ok) throw new Error("コメント送信に失敗しました");
      const savedMessage = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          user: savedMessage.user,
          message: savedMessage.message,
          message_id: savedMessage.id, // API のレスポンスに合わせる
        },
      ]);
      setMessage("");
    } catch (error) {
      console.error("コメント送信に失敗:", error);
      setMessages((prev) => [
        ...prev,
        { user: "システム", message: "コメント送信に失敗しました。", message_id: 0 },
      ]);
    }
  };

  // ビューワーに留まるためのスイッチボタン（ViewerPage 用）
  const switchToViewer = () => {
    router.push("/viewer");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#e9f2e9]">
      <header className="bg-white border-b border-[#4D7C4D] p-2 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <Image
            src="/images/logo.png"
            alt="アンタオサウルス"
            width={40}
            height={40}
            className="rounded-full"
            priority
          />
          <h1 className="text-[min(9vw,60px)] font-bold text-[#4D7C4D]">
            Live Coders
            <span className="block mt-1 text-[min(2vw,20px)] text-gray-600">
              視聴者ーモード
            </span>
          </h1>
          {/* ViewerPage 用に、スイッチボタンは Viewer に切り替える動作（ルーティング先: "/viewer"） */}
          <Button
            variant="outline"
            onClick={switchToViewer}
            className="border-[#4D7C4D] text-[#4D7C4D] hover:bg-[#e9f2e9] hover:text-[#3a5e3a]"
          >
            ビューワーに切替
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <LiveCard showUpdateForm={false} showStopStreamingForm={false} />
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
              <CardTitle className="text-lg">
                <Users size={20} /> 視聴者 ({newUniqueUsers.length}人)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {newUniqueUsers.map((viewer, index) => (
                    <div key={index} className="text-sm">
                      {viewer}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          {/* いいね機能付きコメントカード */}
          <CommentCard
            messages={messages}
            message={message}
            setMessage={setMessage}
            handleSendMessage={handleSendMessage}
            roomId={roomId}
            currentUserId={currentUserId}
          />
        </div>
      </main>
      <footer className="bg-white border-t border-[#4D7C4D] p-4 text-center text-sm text-[#4D7C4D]">
        アンタオサウルス © 2025
      </footer>
    </div>
  );
}
