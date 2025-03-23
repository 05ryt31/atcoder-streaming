// components/ProblemContent.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, ExternalLink, AlertTriangle } from "lucide-react"

interface ProblemContentProps {
  problemId: string
  problemTitle: string
  problemUrl: string
  contestId?: string
  problemIndex?: string
  showHeader?: boolean
}

// 問題内容の型定義
interface ProblemContent {
  statement: string
  constraints: string
  timeLimit?: string
  memoryLimit?: string
}

// 複数のプロキシを試す
async function tryProxies(url: string): Promise<string | null> {
  const proxies = [
    `https://api.codetabs.com/v1/proxy?quest=`
  ]
  
  for (const proxy of proxies) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`
      
      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
        }
      })
      
      if (response.ok) {
        return await response.text()
      }
    } catch (err) {
      // このプロキシでは失敗したので次を試す
      continue
    }
  }
  
  // すべてのプロキシが失敗
  return null
}

export default function ProblemContent({ 
  problemId, 
  problemTitle, 
  problemUrl, 
  contestId, 
  problemIndex,
  showHeader = true
}: ProblemContentProps) {
  // 問題内容関連の状態
  const [problemContent, setProblemContent] = useState<ProblemContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 問題が選択されたら内容を取得
    if (problemUrl) {
      fetchProblemContent(problemUrl)
    }
  }, [problemUrl])

  // 問題内容を取得する関数
  const fetchProblemContent = async (url: string) => {
    setLoading(true)
    setError(null)
    setProblemContent(null)
    
    try {
      // 問題ページのHTMLを取得
      const html = await tryProxies(url)
      
      if (!html) {
        setError("問題ページの取得に失敗しました")
        setLoading(false)
        return
      }
      
      // 簡易的なHTMLパース
      // 問題文のセクションを抽出
      const taskStatementMatch = html.match(/<div id="task-statement"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i)

      if (!taskStatementMatch) {
        setError("問題内容の抽出に失敗しました")
        setLoading(false)
        return
      }
      
      const taskStatement = taskStatementMatch[1]
      
      // 日本語セクションを優先して抽出
      const jaMatch = taskStatement.match(/<span class="lang-ja"[^>]*>([\s\S]*?)<\/span>\s*<span class="lang-en"/i)
      const enMatch = taskStatement.match(/<span class="lang-en"[^>]*>([\s\S]*?)<\/span>/i)
      
      const contentHtml = jaMatch ? jaMatch[1] : (enMatch ? enMatch[1] : taskStatement)
      
      // 時間制限・メモリ制限を抽出
      const timeLimitMatch = html.match(/時間制限.*?(\d+\s*秒)/i) || html.match(/Time Limit.*?(\d+\s*sec)/i)
      const memoryLimitMatch = html.match(/メモリ制限.*?(\d+\s*MB)/i) || html.match(/Memory Limit.*?(\d+\s*MB)/i)
      
      // 制約を抽出
      const constraintsJaMatch = contentHtml.match(/<h3>制約<\/h3>([\s\S]*?)(?:<h3>|$)/i)
      const constraintsEnMatch = contentHtml.match(/<h3>Constraints<\/h3>([\s\S]*?)(?:<h3>|$)/i)
      const constraints = (constraintsJaMatch || constraintsEnMatch) ? 
        (constraintsJaMatch ? constraintsJaMatch[1] : constraintsEnMatch![1]) : ""
      
      // 問題内容データを構築
      setProblemContent({
        statement: contentHtml,
        constraints,
        timeLimit: timeLimitMatch ? timeLimitMatch[1] : "不明",
        memoryLimit: memoryLimitMatch ? memoryLimitMatch[1] : "不明"
      })
      
    } catch (err) {
      setError("問題内容の取得中にエラーが発生しました")
      console.error("問題内容の取得中にエラーが発生しました:", err)
    } finally {
      setLoading(false)
    }
  }

  // コンポーネントのメインレンダリング
  return (
    <Card className="border-[#B5D267]">
      {showHeader && (
        <CardHeader className="bg-[#4D7C4D] text-white pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code size={20} />
            問題内容
            {contestId && problemIndex && (
              <span className="text-sm font-normal ml-2">
                {contestId.toUpperCase()} {problemIndex.toUpperCase()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center items-center h-64 p-4">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4D7C4D]"></div>
              <p className="text-sm text-gray-500">問題内容を取得中...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertTriangle size={32} className="mx-auto mb-3 text-amber-500" />
            <p className="text-gray-600">{error}</p>
            <Button
              variant="outline"
              onClick={() => window.open(problemUrl, '_blank')}
              className="mt-4 border-[#B5D267] text-[#4D7C4D]"
            >
              <ExternalLink size={16} className="mr-2" />
              公式ページで確認
            </Button>
          </div>
        ) : problemContent ? (
          <Tabs defaultValue="statement" className="w-full">
            <div className="border-b border-[#B5D267]">
              <TabsList className="p-0 bg-transparent">
                <TabsTrigger 
                  value="statement"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#4D7C4D] border-b-2 data-[state=active]:border-[#4D7C4D] rounded-none"
                >
                  問題文
                </TabsTrigger>
                <TabsTrigger 
                  value="constraints"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#4D7C4D] border-b-2 data-[state=active]:border-[#4D7C4D] rounded-none"
                >
                  制約
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="statement" className="p-4 m-0">
              <div className="space-y-4">
                {/* 問題タイトル */}
                <h3 className="font-bold text-[#0A5E5C] text-lg">
                  {problemTitle}
                </h3>
                
                <div>
                  <p className="text-sm text-gray-500">
                    {problemContent.timeLimit && `時間制限: ${problemContent.timeLimit}`}
                    {problemContent.memoryLimit && ` | メモリ制限: ${problemContent.memoryLimit}`}
                  </p>
                </div>
                
                {/* 問題文 - 安全に表示するためにdangerouslySetInnerHTMLを使用 */}
                <div 
                  className="problem-statement prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: problemContent.statement
                  }}
                ></div>
              </div>
            </TabsContent>
            
            <TabsContent value="constraints" className="p-4 m-0">
              <div className="space-y-4">
                {problemContent.constraints ? (
                  <div 
                    className="problem-constraints prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: problemContent.constraints
                    }}
                  ></div>
                ) : (
                  <p className="text-gray-500 italic">制約情報が見つかりませんでした。公式ページでご確認ください。</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p>問題が選択されていません。</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}