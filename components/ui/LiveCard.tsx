import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image"; // Next.js の Image コンポーネントを使用する場合

interface LiveCardProps {
  showUpdateForm?: boolean;
  showStopStreamingForm?: boolean;
}

const extractLiveVideoId = (url: string): string | null => {
  const regExp = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

const LiveCard: React.FC<LiveCardProps> = ({
  showUpdateForm = true,
  showStopStreamingForm = true,
}) => {
  const [youtubeLink, setYoutubeLink] = useState("");
  const [videoId, setVideoId] = useState<string>("");

  // ページロード時に localStorage から videoId を読み込む
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedVideoId = localStorage.getItem("videoId");
      if (storedVideoId) {
        setVideoId(storedVideoId);
      }
    }
  }, []);

  // videoId が変わるたびに localStorage に保存する
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("videoId", videoId);
    }
  }, [videoId]);

  // 更新フォームのハンドラー
  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const extractedId = extractLiveVideoId(youtubeLink);
    if (extractedId) {
      setVideoId(extractedId);
    } else {
      alert("ライブ動画のURLのみ対応しています。");
    }
  };

  // 配信をやめるボタンのハンドラー
  const handleStopStreaming = () => {
    setVideoId("");
    setYoutubeLink("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("videoId");
    }
  };

  return (
    <Card className="border-[#4D7C4D] overflow-hidden">
      <div className="relative">
        {/* オーバーレイ部分：LIVEバッジ */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <span
            className={`live-badge ${
              videoId ? "bg-red-600 text-white" : "bg-gray-500 text-white"
            }`}
          >
            LIVE
          </span>
        </div>
        {/* YouTube動画の埋め込み部分 */}
        <div className="aspect-video flex items-center justify-center">
          {videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-500">
              <p className="text-white text-xl">ここにライブ動画</p>
            </div>
          )}
        </div>
      </div>

      {/* カードの下部コンテンツ */}
      <CardContent className="p-4 bg-white">
        {showUpdateForm && (
          <form onSubmit={handleUpdate} className="mb-4">
            <label
              htmlFor="youtube-link"
              className="block text-sm font-medium text-gray-700"
            >
              YouTubeライブのリンクを入力
            </label>
            <div className="mt-1 flex">
              <input
                type="text"
                id="youtube-link"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="https://www.youtube.com/live/動画ID?si=xxxxxxx"
                className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button
                type="submit"
                className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                更新
              </button>
            </div>
          </form>
        )}

        {showStopStreamingForm && (
          <div className="flex">
            <button
              type="button"
              onClick={handleStopStreaming}
              disabled={!videoId}
              className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              配信をやめる
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { LiveCard };
