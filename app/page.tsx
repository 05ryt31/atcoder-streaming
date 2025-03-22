"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState("viewer")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    // 実際のアプリケーションでは認証ロジックを実装します
    // ここではシンプルにリダイレクトのみ行います
    if (userType === "driver") {
      router.push("/driver")
    } else {
      router.push("/viewer")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#e9f2e9]">
      <Card className="w-full max-w-md border-[#4D7C4D] border-2">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image src="/images/logo.png" alt="アンタオサウルス" width={120} height={120} className="rounded-full" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-[#4D7C4D]">アンタオサウルス</CardTitle>
          <CardDescription className="text-center">AtCoderの配信を視聴または配信しましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="viewer" onValueChange={setUserType}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="viewer" className="data-[state=active]:bg-[#4D7C4D] data-[state=active]:text-white">
                視聴者
              </TabsTrigger>
              <TabsTrigger value="driver" className="data-[state=active]:bg-[#4D7C4D] data-[state=active]:text-white">
                配信者（ドライバー）
              </TabsTrigger>
            </TabsList>
            <form onSubmit={handleLogin}>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="username">ユーザー名</Label>
                  <Input
                    id="username"
                    placeholder="ユーザー名を入力"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="border-[#B5D267] focus-visible:ring-[#4D7C4D]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-[#B5D267] focus-visible:ring-[#4D7C4D]"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#4D7C4D] hover:bg-[#3a5e3a] text-white">
                  {userType === "driver" ? "ドライバーとしてログイン" : "視聴者としてログイン"}
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">アカウントをお持ちでない場合は、AtCoderで登録してください</p>
        </CardFooter>
      </Card>
    </div>
  )
}

