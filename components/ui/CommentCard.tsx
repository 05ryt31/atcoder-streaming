"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Heart } from "lucide-react";
import type { Message } from "@/components/ui/props";

interface CommentCardProps {
  messages: Message[];
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => Promise<void>;
  showHeart?: boolean;
}

const CommentCard: React.FC<CommentCardProps> = ({
  messages,
  message,
  setMessage,
  handleSendMessage,
  showHeart = true,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 各コメントごとの「いいね」状態（true/false）と獲得数を管理
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [heartCounts, setHeartCounts] = useState<Record<string, number>>({});

  // ユニークキー生成（可能ならコメントに固有IDがあればそれを使うのが望ましい）
  const getMessageKey = (msg: Message) => `${msg.user}-${msg.message}`;

  // 初回マウント時に localStorage から状態を読み込む
  useEffect(() => {
    const savedLiked = localStorage.getItem("likedComments");
    if (savedLiked) {
      setLikedComments(JSON.parse(savedLiked));
    }
    const savedCounts = localStorage.getItem("heartCounts");
    if (savedCounts) {
      setHeartCounts(JSON.parse(savedCounts));
    }
  }, []);

  // 状態が変わるたびに localStorage に保存する
  useEffect(() => {
    localStorage.setItem("likedComments", JSON.stringify(likedComments));
  }, [likedComments]);

  useEffect(() => {
    localStorage.setItem("heartCounts", JSON.stringify(heartCounts));
  }, [heartCounts]);

  // storage イベントリスナーで他ページの更新も反映する
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "likedComments" && event.newValue) {
        setLikedComments(JSON.parse(event.newValue));
      }
      if (event.key === "heartCounts" && event.newValue) {
        setHeartCounts(JSON.parse(event.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // クリック可能な場合のみ toggleLike を実行
  const toggleLike = (key: string) => {
    if (!showHeart) return;
    setLikedComments((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      return newState;
    });
    setHeartCounts((prev) => {
      const currentCount = prev[key] || 0;
      // もしすでにいいねしているなら解除（減算）、そうでなければ追加（加算）
      const newCount = likedComments[key] ? currentCount - 1 : currentCount + 1;
      return { ...prev, [key]: newCount < 0 ? 0 : newCount };
    });
  };

  return (
    <Card className="border-[#B5D267] w-full sm:w-[330px]">
      <CardHeader className="bg-[#4D7C4D] text-white py-2 px-4">
        <CardTitle className="text-base font-semibold">コメント</CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <ScrollArea className="h-[300px] overflow-y-auto pr-4">
          <div ref={scrollContainerRef}>
            {[...messages].reverse().map((msg, index, arr) => {
              const key = getMessageKey(msg);
              // 現在のいいね状態とカウント
              const isLiked = likedComments[key] || false;
              const count = heartCounts[key] || 0;
              return (
                <div
                  key={index}
                  className="mb-4 animate-fadeInDown flex justify-between items-center"
                  style={{ whiteSpace: "pre-line" }}
                >
                  <div>
                    <div className="font-semibold text-[#0A5E5C]">{msg.user}</div>
                    <div className="text-sm">{msg.message}</div>
                    {index < arr.length - 1 && (
                      <Separator className="mt-2 bg-[#B5D267]" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {showHeart ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(key)}
                        className="p-1"
                      >
                        <Heart size={18} className={isLiked ? "text-red-500" : "text-gray-400"} />
                      </Button>
                    ) : (
                      // 操作不可の場合は常にハートアイコンを表示
                      <span>
                        <Heart size={18} className={isLiked ? "text-red-500" : "text-gray-400"} />
                      </span>
                    )}
                    {/* ハート獲得数の表示 */}
                    <span className="text-xs text-gray-600">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="mt-2 flex gap-2">
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
  );
};

export default CommentCard;
