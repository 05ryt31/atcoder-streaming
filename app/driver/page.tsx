"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Code, Send, Video, Users } from "lucide-react"

export default function DriverPage() {
  const router = useRouter()
  const [streamTitle, setStreamTitle] = useState("ABC123の問題を解く")
  const [problemId, setProblemId] = useState("abc123_c")
  const [isLive, setIsLive] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    { user: "システム", text: "配信の準備ができました" },
    { user: "ユーザー1", text: "こんにちは！今日はどんな問題を解きますか？" },
  ])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      setMessages([...messages, { user: "ドライバー", text: message }])
      setMessage("")
    }
  }

  const switchToViewer = () => {
    router.push("/viewer")
  }

  const toggleLiveStatus = () => {
    setIsLive(!isLive)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#e9f2e9]">
      <header className="bg-white border-b border-[#4D7C4D] p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="アンタオサウルス" width={40} height={40} className="rounded-full" />
            <h1 className="text-xl font-bold text-[#4D7C4D]">アンタオサウルス - ドライバーモード</h1>
            {isLive && <span className="live-badge ml-2">LIVE</span>}
          </div>
          <Button
            variant="outline"
            onClick={switchToViewer}
            className="border-[#4D7C4D] text-[#4D7C4D] hover:bg-[#e9f2e9] hover:text-[#3a5e3a]"
          >
            視聴者モードに切替
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-[#B5D267]">
            <CardHeader className="bg-[#4D7C4D] text-white pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video size={20} />
                配信設定
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#0A5E5C]">配信タイトル</label>
                  <Input
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="配信タイトルを入力"
                    className="border-[#B5D267] focus-visible:ring-[#4D7C4D]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#0A5E5C]">問題ID</label>
                  <Select value={problemId} onValueChange={setProblemId}>
                    <SelectTrigger className="border-[#B5D267] focus:ring-[#4D7C4D]">
                      <SelectValue placeholder="問題を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abc123_a">ABC123 - A問題</SelectItem>
                      <SelectItem value="abc123_b">ABC123 - B問題</SelectItem>
                      <SelectItem value="abc123_c">ABC123 - C問題</SelectItem>
                      <SelectItem value="abc123_d">ABC123 - D問題</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={toggleLiveStatus}
                  className={
                    isLive ? "bg-red-500 hover:bg-red-600 text-white" : "bg-[#FFBA0D] hover:bg-[#e6a700] text-white"
                  }
                >
                  {isLive ? "配信を終了する" : "配信を開始する"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#B5D267] overflow-hidden">
            <div className="bg-[#0A5E5C] aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-2xl font-semibold">配信プレビュー</p>
                <p className="text-gray-200">{isLive ? "ライブ配信中" : "配信準備中"}</p>
              </div>
            </div>
          </Card>

          <Card className="border-[#B5D267]">
            <CardHeader className="bg-[#4D7C4D] text-white pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code size={20} />
                コードエディタ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Textarea
                className="font-mono h-[200px] border-[#B5D267] focus-visible:ring-[#4D7C4D]"
                placeholder="ここにコードを入力..."
                defaultValue={`#include <iostream>
using namespace std;

int main() {
  int N;
  cin >> N;
  
  // ここにコードを書く
  
  return 0;
}`}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-1">
          <Card className="border-[#B5D267]">
            <CardHeader className="bg-[#4D7C4D] text-white pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users size={20} />
                視聴者 (12人)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  <div className="text-sm">ユーザー1</div>
                  <div className="text-sm">ユーザー2</div>
                  <div className="text-sm">ユーザー3</div>
                  <div className="text-sm">ユーザー4</div>
                  <div className="text-sm">ユーザー5</div>
                  <div className="text-sm">ユーザー6</div>
                  <div className="text-sm">ユーザー7</div>
                  <div className="text-sm">ユーザー8</div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-[#B5D267]">
            <CardHeader className="bg-[#4D7C4D] text-white pb-2">
              <CardTitle className="text-lg">コメント</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[300px] pr-4">
                {messages.map((msg, index) => (
                  <div key={index} className="mb-4">
                    <div className="font-semibold text-[#0A5E5C]">{msg.user}</div>
                    <div className="text-sm">{msg.text}</div>
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
  )
}

