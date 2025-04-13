"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Heart } from "lucide-react";
import type { Message } from "@/components/ui/props";

interface CommentCardProps {
  messages: Message[];
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => Promise<void>;
  roomId: number;
  currentUserId: number;
}

// いいね情報の型
interface LikeStatus {
  liked_by_me: boolean;
  liked_cnt: number;
}

const CommentCard: React.FC<CommentCardProps> = ({
  messages,
  message,
  setMessage,
  handleSendMessage,
  roomId,
  currentUserId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 各メッセージごとのいいね情報を管理（キーは message_id）
  const [likeInfo, setLikeInfo] = useState<Record<number, LikeStatus>>({});

  // GET /messages/{roomId}?user_id= の結果から、各メッセージのいいね情報を更新
  useEffect(() => {
    const fetchLikeInfo = async () => {
      try {
        // 末尾にスラッシュを追加して FastAPI 側のルーティングに合わせる
        const res = await fetch(
          `https://mobpro-api.taketo-u.net/messages/${roomId}/?user_id=${currentUserId}`
        );
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const data = await res.json();
        const info: Record<number, LikeStatus> = {};
        data.forEach((msg: any) => {
          info[msg.message_id] = {
            liked_by_me: msg.liked_by_me,
            liked_cnt: msg.liked_cnt,
          };
        });
        setLikeInfo(info);
      } catch (error) {
        console.error("いいね情報の取得に失敗しました:", error);
      }
    };
    fetchLikeInfo();
  }, [roomId, currentUserId, messages]);

  // いいねボタンのトグル処理
  const toggleLike = async (messageId: number) => {
    const currentStatus = likeInfo[messageId] || { liked_by_me: false, liked_cnt: 0 };
    const newLikedState = !currentStatus.liked_by_me;

    // UI を即時更新
    setLikeInfo((prev) => ({
      ...prev,
      [messageId]: {
        liked_by_me: newLikedState,
        liked_cnt: newLikedState
          ? currentStatus.liked_cnt + 1
          : Math.max(currentStatus.liked_cnt - 1, 0),
      },
    }));

    try {
      const endpoint = newLikedState
        ? `https://mobpro-api.taketo-u.net/messages/like/${messageId}/?user_id=${currentUserId}`
        : `https://mobpro-api.taketo-u.net/messages/unlike/${messageId}/?user_id=${currentUserId}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Status: ${res.status}`);
    } catch (error) {
      console.error("いいねの更新に失敗しました:", error);
      // 必要に応じて再同期処理を追加
    }
  };

  return (
    <Card className="border-[#B5D267]">
      <CardHeader className="bg-[#4D7C4D] text-white pb-2">
        <CardTitle className="text-lg">コメント</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-[500px] pr-4">
          {messages.map((msg) => {
            const messageId = msg.message_id;
            const info = likeInfo[messageId] || { liked_by_me: false, liked_cnt: 0 };
            return (
              <div key={messageId} className="mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-[#0A5E5C]">{msg.user}</div>
                    <div className="text-sm">{msg.message}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(messageId)}
                      className="p-1"
                    >
                      <Heart
                        size={18}
                        className={info.liked_by_me ? "text-red-500" : "text-gray-400"}
                      />
                    </Button>
                    <span className="text-xs text-gray-600">{info.liked_cnt}</span>
                  </div>
                </div>
                <Separator className="mt-2 bg-[#B5D267]" />
              </div>
            );
          })}
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
  );
};

export default CommentCard;
