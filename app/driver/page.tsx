"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Code, Send, Video, Users, BookOpen } from "lucide-react"
import { LiveCard } from '@/components/ui/LiveCard'; // LiveCard コンポーネントをインポート
import { Message } from "@/components/ui/props";
import { fetchComments } from "@/handlers/fetchComments";

interface Problem {
  id: string;
  contest_id: string;
  problem_index: string;
  name: string;
  title: string;
}

interface DetailedProblem extends Problem {
  shortest_submission_id: number | null;
  fastest_submission_id: number | null;
  first_submission_id: number | null;
  solver_count: number;
  point: number | null;
}

interface ProblemModel {
  difficulty?: number;
  is_experimental?: boolean;
  raw_difficulty?: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const BASE_URL = 'https://kenkoooo.com/atcoder';

function getResourceUrl(resourceName: string): string {
  return `${BASE_URL}/resources/${resourceName}.json`;
}

class AtCoderProblemsClient {
  async getProblems(): Promise<Problem[]> {
    return fetchJson<Problem[]>(getResourceUrl('problems'));
  }

  async getDetailedProblems(): Promise<DetailedProblem[]> {
    return fetchJson<DetailedProblem[]>(getResourceUrl('merged-problems'));
  }

  async getEstimatedDifficulties(): Promise<Record<string, ProblemModel>> {
    return fetchJson<Record<string, ProblemModel>>(getResourceUrl('problem-models'));
  }
}
export default function DriverPage() {
  const router = useRouter()
  const [streamTitle, setStreamTitle] = useState("ABC123の問題を解く")
  const [problemId, setProblemId] = useState("abc123_c")
  const [isLive, setIsLive] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([]);

  const [problems, setProblems] = useState<DetailedProblem[]>([])
  const [problemDifficulties, setProblemDifficulties] = useState<Record<string, ProblemModel>>({})
  const [loading, setLoading] = useState(true)
  const [selectedProblem, setSelectedProblem] = useState<DetailedProblem | null>(null)
  const [problemStatement, setProblemStatement] = useState("")

  const apiClient = new AtCoderProblemsClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [detailedProblems, difficulties] = await Promise.all([
          apiClient.getDetailedProblems(),
          apiClient.getEstimatedDifficulties()
        ]);

        const filteredProblems = detailedProblems
          .filter(p =>
            difficulties[p.id]?.difficulty !== undefined &&
            p.contest_id.startsWith('abc') &&
            parseInt(p.contest_id.replace('abc', '')) >= 100
          )
          .sort((a, b) => {
            if (a.contest_id === b.contest_id) {
              return a.problem_index.localeCompare(b.problem_index);
            }
            return b.contest_id.localeCompare(a.contest_id);
          });
        
        setProblems(filteredProblems);
        setProblemDifficulties(difficulties);

        if (filteredProblems.length > 0) {
          setProblemId(filteredProblems[0].id);
          setSelectedProblem(filteredProblems[0]);
          setStreamTitle(`${filteredProblems[0].contest_id.toUpperCase()} ${filteredProblems[0].problem_index} - ${filteredProblems[0].name}を解く`)
        }
      } catch (error) {
        console.error("問題のデータの取得に失敗しました:", error);
        setMessages([...messages, { user: "システム", message: "AtCoder Problemsからの問題取得に失敗しました。"}]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const fetchCommentData = async () => {
      const result = await fetchComments('https://mobpro-api.taketo-u.net/messages/qWjlNO');
      if (result) {
        setMessages(result.messages); // 取得したメッセージをセット
      }
    };
    fetchCommentData();
  }, []);

  useEffect(() => {
    if (!problemId) return;

    const problem = problems.find(p => p.id === problemId);
    if (problem) {
      setSelectedProblem(problem);
      setStreamTitle(`${problem.contest_id.toUpperCase()} ${problem.problem_index} - ${problem.name}を解く`);

      const contestId = problem.contest_id;
      const taskName = problem.problem_index.toLowerCase();

      setProblemStatement(`https://atcoder.jp/contests/${contestId}/tasks/${problem.id}`);

      setMessages([
        ...messages,
        {
          user: "システム",
          message: `問題『${problem.name}』が選択されました。難易度: ${
            problemDifficulties[problem.id]?.difficulty
              ? Math.floor(problemDifficulties[problem.id].difficulty!)
              : "不明"
          }`
        }
      ]);
    }
  }, [problemId]);

  // ユーザーをSetでユニークにし、その後配列に変換
  const uniqueUsers = new Set(messages.map(item => item.user));
  // Setを配列に変換
  const newUniqueUsers = [...uniqueUsers];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      setMessages([...messages, { user: "ドライバー", message: message }])
      setMessage("")
    }
  }

  const switchToViewer = () => {
    router.push("/viewer")
  }

  const toggleLiveStatus = () => {
    setIsLive(!isLive)
  }

  // 問題の難易度に応じた色を返す
  const getDifficultyColor = (difficulty: number | undefined) => {
    if (!difficulty) return "text-gray-500";
    
    if (difficulty < 400) return "text-gray-600";
    if (difficulty < 800) return "text-brown-600";
    if (difficulty < 1200) return "text-green-600";
    if (difficulty < 1600) return "text-cyan-600";
    if (difficulty < 2000) return "text-blue-600";
    if (difficulty < 2400) return "text-yellow-600";
    if (difficulty < 2800) return "text-orange-600";
    return "text-red-600";
  }

    // 問題の難易度ラベルを生成
    const getDifficultyLabel = (difficulty: number | undefined) => {
      if (!difficulty) return "不明";
      return Math.floor(difficulty).toString();
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
                  <label className="text-sm font-medium text-[#0A5E5C]">問題選択</label>
                  <Select value={problemId} onValueChange={setProblemId} disabled={loading}>
                    <SelectTrigger className="border-[#B5D267] focus:ring-[#4D7C4D]">
                      <SelectValue placeholder={loading ? "問題を読み込み中..." : "問題を選択"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {problems.map((problem) => (
                        <SelectItem key={problem.id} value={problem.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{problem.contest_id.toUpperCase()} {problem.problem_index} - {problem.name}</span>
                            <span className={getDifficultyColor(problemDifficulties[problem.id]?.difficulty)}>
                              {getDifficultyLabel(problemDifficulties[problem.id]?.difficulty)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
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

          {selectedProblem && (
            <Card className="border-[#B5D267]">
              <CardHeader className="bg-[#4D7C4D] text-white pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-lg">
                  <div className="flex items-center gap-2">
                    <BookOpen size={20} />
                    問題: {selectedProblem.name}
                  </div>
                  <div className="text-sm">
                    難易度: <span className={getDifficultyColor(problemDifficulties[selectedProblem.id]?.difficulty)}>
                      {getDifficultyLabel(problemDifficulties[selectedProblem.id]?.difficulty)}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">コンテスト: {selectedProblem.contest_id.toUpperCase()}</p>
                      <p className="text-sm text-gray-500">点数: {selectedProblem.point}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(problemStatement, '_blank')}
                      className="border-[#B5D267] text-[#4D7C4D] hover:bg-[#e9f2e9]"
                    >
                      問題ページを開く
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm">
                      この問題を解いた人数: {selectedProblem.solver_count} 人
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <LiveCard showUpdateForm={true} showStopStreamingForm={true} />
        </div>

        <div className="space-y-4 lg:col-span-1">
          <Card className="border-[#B5D267]">
            <CardHeader className="bg-[#4D7C4D] text-white pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users size={20} />
                視聴者 ({newUniqueUsers.length}人)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                {newUniqueUsers.map((viewer, index) => (
                  <div key={index} className="text-sm">{viewer}</div>
                ))}
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
  )
}

