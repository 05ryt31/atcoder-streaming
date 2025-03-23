import { NextResponse } from "next/server";
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contest');

    if (!contestId) {
        return NextResponse.json(
            { error: 'コンテストIDが指定されていません' },
            { status: 400 }
        );
    }

    try {
        // コンテスト問題一覧ページを取得
        const problemsListUrl = `https://atcoder.jp/contests/${contestId}/tasks`;
        const problemsListResponse = await fetch(problemsListUrl, {
            headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AtCoderProblemsFetcher/1.0)'
            }
        });

        if (!problemsListResponse.ok) {
            throw new Error(`コンテスト「${contestId}」の問題一覧を取得できませんでした。ステータスコード: ${problemsListResponse.status}`);
        }
        
        const html = await problemsListResponse.text();
        const $ = cheerio.load(html);
        
        // 問題リンクを抽出
        const problems: { id: string; title: string; url: string }[] = [];

        $('table tbody tr').each((_, element) => {
            const problemLink = $(element).find('td:nth-child(2) a');
            const href = problemLink.attr('href');
            
            if (href && href.includes(`/contests/${contestId}/tasks/`)) {
                const id = href.split('/').pop() || '';
                const title = problemLink.text().trim();
                const url = `https://atcoder.jp${href}`;

                problems.push({ id, title, url });
            }
        });
        
        if (problems.length === 0) {
            return NextResponse.json(
                { error: '問題が見つかりませんでした。コンテストIDが正しいか確認してください。' },
                { status: 404 }
            );
        }

        // 最初の問題の詳細情報も取得する
        const firstProblemUrl = problems[0].url;
        const firstProblemResponse = await fetch(firstProblemUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AtCoderProblemsFetcher/1.0)'
            }
        });
    
        let firstProblemHtml = '';
        let problemStatement = '';
        let constraints = '';
    
        if (firstProblemResponse.ok) {
            firstProblemHtml = await firstProblemResponse.text();
            const $problem = cheerio.load(firstProblemHtml);

        // 問題文を抽出
        const statementSection = $problem('#task-statement');

        // 日本語の問題文を優先
        const japaneseStatement = statementSection.find('.lang-ja').html() || '';
        const englishStatement = statementSection.find('.lang-en').html() || '';

        // 問題文のHTMLを取得
        problemStatement = japaneseStatement || englishStatement || '';

        // 制約条件を抽出（簡易的な実装）
        constraints = $problem('#task-statement h3:contains("制約")').next('ul').html() || 
                    $problem('#task-statement h3:contains("Constraints")').next('ul').html() || '';
        }

        return NextResponse.json({
            contestId,
            problems,
            firstProblem: problems[0] ? {
                ...problems[0],
                statement: problemStatement,
                constraints
            } : null
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'エラーが発生しました。詳細: ' + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}