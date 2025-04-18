"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Video, Users } from "lucide-react";
import { LiveCard } from "@/components/ui/LiveCard";
import type { Message } from "@/components/ui/props";
import { fetchComments } from "@/handlers/fetchComments";
import ProblemContent from "@/components/ui/problem-content";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import CommentCard from "@/components/ui/CommentCard";

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

interface ScrapedProblem {
  id: string;
  title: string;
  url: string;
}

interface ScrapedProblemData {
  contestId: string;
  problems: ScrapedProblem[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const BASE_URL = "https://kenkoooo.com/atcoder";

function getResourceUrl(resourceName: string): string {
  return `${BASE_URL}/resources/${resourceName}.json`;
}

class AtCoderProblemsClient {
  async getProblems(): Promise<Problem[]> {
    return fetchJson<Problem[]>(getResourceUrl("problems"));
  }

  async getDetailedProblems(): Promise<DetailedProblem[]> {
    return fetchJson<DetailedProblem[]>(getResourceUrl("merged-problems"));
  }

  async getEstimatedDifficulties(): Promise<Record<string, ProblemModel>> {
    return fetchJson<Record<string, ProblemModel>>(getResourceUrl("problem-models"));
  }
}

export default function ViewerPage() {
  const router = useRouter();
  const [streamTitle, setStreamTitle] = useState("ABC123の問題を解く");
  const [problemId, setProblemId] = useState("abc123_c");
  const [isLive, setIsLive] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [problems, setProblems] = useState<DetailedProblem[]>([]);
  const [problemDifficulties, setProblemDifficulties] = useState<Record<string, ProblemModel>>({});
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<DetailedProblem | null>(null);
  const [problemUrl, setProblemUrl] = useState("");
  const [scrapedProblems, setScrapedProblems] = useState<ScrapedProblemData | null>(null);

  // 固定値（実際はログインユーザーのIDなどから取得）
  const roomId = 1;
  const currentUserId = 1;

  const apiClient = new AtCoderProblemsClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [detailedProblems, difficulties] = await Promise.all([
          apiClient.getDetailedProblems(),
          apiClient.getEstimatedDifficulties(),
        ]);

        const filteredProblems = detailedProblems
          .filter(
            (p) =>
              difficulties[p.id]?.difficulty !== undefined &&
              p.contest_id.startsWith("abc") &&
              parseInt(p.contest_id.replace("abc", "")) >= 100
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
          setStreamTitle(
            `${filteredProblems[0].contest_id.toUpperCase()} ${filteredProblems[0].problem_index} - ${filteredProblems[0].name}を解く`
          );
        }
      } catch (error) {
        console.error("問題のデータ取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // コメントデータ取得：GET リクエストの URL は末尾にスラッシュと ?user_id= を付与
    const fetchCommentData = async () => {
      const result = await fetchComments(`https://mobpro-api.taketo-u.net/messages/${roomId}/?user_id=${currentUserId}`);
      if (result && Array.isArray(result)) {
        setMessages(result);
      } else {
        console.warn("コメントデータの取得に失敗または形式不正:", result);
      }
    };
    fetchCommentData();
  }, []);

  useEffect(() => {
    if (!problemId) return;
    const problem = problems.find((p) => p.id === problemId);
    if (problem) {
      setSelectedProblem(problem);
      setStreamTitle(
        `${problem.contest_id.toUpperCase()} ${problem.problem_index} - ${problem.name}を解く`
      );
      const url = `https://atcoder.jp/contests/${problem.contest_id}/tasks/${problem.id}`;
      setProblemUrl(url);
      setMessages((prev) => [
        ...prev,
        {
          user: "システム",
          message: `問題『${problem.name}』が選択されました。難易度: ${
            problemDifficulties[problem.id]?.difficulty
              ? Math.floor(problemDifficulties[problem.id].difficulty!)
              : "不明"
          }`,
          message_id: Date.now(), // Use a unique identifier
        },
      ]);
    } else if (scrapedProblems) {
      const scrapedProblem = scrapedProblems.problems.find(p => p.id === problemId);
      if (scrapedProblem) {
        const simpleProblem: DetailedProblem = {
          id: scrapedProblem.id,
          contest_id: scrapedProblems.contestId,
          problem_index: scrapedProblem.id.split('_')[1] || '',
          name: scrapedProblem.title,
          title: scrapedProblem.title,
          shortest_submission_id: null,
          fastest_submission_id: null,
          first_submission_id: null,
          solver_count: 0,
          point: null
        };
        setSelectedProblem(simpleProblem);
        setProblemUrl(scrapedProblem.url);
        setStreamTitle(
          `${simpleProblem.contest_id.toUpperCase()} ${simpleProblem.problem_index.toUpperCase()} - ${simpleProblem.name}を解く`
        );
        setMessages((prev) => [
          ...prev,
          {
            user: "システム",
            message: `問題『${simpleProblem.name}』が選択されました。`,
            message_id: Date.now(), // Use a unique identifier
          }
        ]);
      }
    }
  }, [problemId, problems, scrapedProblems]);

  const uniqueUsers = new Set(messages.map((item) => item.user));
  const newUniqueUsers = [...uniqueUsers];

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

  const switchToViewer = () => {
    router.push("/viewer");
  };

  const toggleLiveStatus = () => {
    setIsLive(!isLive);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#e9f2e9]">
      <header className="bg-white border-b border-[#4D7C4D] p-2 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
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
                ドライバーモード
              </span>
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={switchToViewer}
            className="border-[#4D7C4D] text-[#4D7C4D] hover:bg-[#e9f2e9] hover:text-[#3a5e3a]"
          >
            視聴者に切替
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
                  <label className="text-sm font-medium text-[#0A5E5C]">
                    配信タイトル
                  </label>
                  <Input
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="配信タイトルを入力"
                    className="border-[#B5D267] focus-visible:ring-[#4D7C4D]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0A5E5C]">
                    問題選択
                  </label>
                  <Select
                    value={problemId}
                    onValueChange={setProblemId}
                    disabled={loading}
                  >
                    <SelectTrigger className="border-[#B5D267] focus:ring-[#4D7C4D]">
                      <SelectValue placeholder={loading ? "問題を読み込み中..." : "問題を選択"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {problems.map((problem) => (
                        <SelectItem key={problem.id} value={problem.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>
                              {problem.contest_id.toUpperCase()} {problem.problem_index} - {problem.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={toggleLiveStatus}
                  className={isLive ? "bg-red-500 hover:bg-red-600 text-white" : "bg-[#FFBA0D] hover:bg-[#e6a700] text-white"}
                >
                  {isLive ? "配信を終了する" : "配信を開始する"}
                </Button>
              </div>
            </CardContent>
          </Card>
          {selectedProblem && (
            <ProblemContent
              problemId={selectedProblem.id}
              problemTitle={selectedProblem.name}
              problemUrl={problemUrl}
              contestId={selectedProblem.contest_id}
              problemIndex={selectedProblem.problem_index}
            />
          )}
          <LiveCard showUpdateForm={true} showStopStreamingForm={true} />
        </div>
        <div className="space-y-4 lg:col-span-1">
          <Card className="border-[#B5D267]">
            <CardHeader className="bg-[#4D7C4D] text-white pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users size={20} /> 視聴者 ({newUniqueUsers.length}人)
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
          {/* いいね機能付きコメントカード：CommentCard 内部でコメント一覧、送信フォーム、いいね機能を統一 */}
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
