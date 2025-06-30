import { tool as createTool } from "ai";
import { z } from "zod";

// 实用搜索工具 - 提供有价值的搜索信息和直接链接
export const webSearchTool = createTool({
  description:
    "Search for information and provide useful search links and suggestions. Provides instant answers when available and direct search engine links for comprehensive results.",
  parameters: z.object({
    query: z.string().describe("The search query to look up"),
    max_results: z
      .number()
      .default(5)
      .describe("Maximum number of results to return (default: 5)"),
  }),
  execute: async ({ query, max_results = 5 }) => {
    try {
      let formattedResponse = `🔍 搜索: "${query}"\n\n`;
      let hasInstantResults = false;

      // 1. 尝试获取即时答案
      try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const ddgResponse = await fetch(ddgUrl, {
          headers: { "User-Agent": "SearchBot/1.0" },
        });

        if (ddgResponse.ok) {
          const ddgData = await ddgResponse.json();

          if (ddgData.AbstractText) {
            formattedResponse += `📖 即时信息:\n${ddgData.AbstractText}\n`;
            if (ddgData.AbstractURL) {
              formattedResponse += `📍 来源: ${ddgData.AbstractURL}\n`;
            }
            formattedResponse += "\n";
            hasInstantResults = true;
          }

          if (ddgData.Answer) {
            formattedResponse += `💡 快速答案:\n${ddgData.Answer}\n\n`;
            hasInstantResults = true;
          }

          if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
            formattedResponse += `🔗 相关信息:\n`;
            const topics = ddgData.RelatedTopics.slice(
              0,
              Math.min(3, max_results),
            );
            topics.forEach((topic: any, index: number) => {
              if (topic.Text && topic.FirstURL) {
                formattedResponse += `${index + 1}. ${topic.Text}\n   🌐 ${topic.FirstURL}\n`;
                hasInstantResults = true;
              }
            });
            formattedResponse += "\n";
          }
        }
      } catch (error) {
        console.warn("Instant answer lookup failed:", error);
      }

      // 2. 始终提供直接搜索链接
      formattedResponse += `🌐 直接搜索链接:\n`;
      const encodedQuery = encodeURIComponent(query);
      formattedResponse += `• Google: https://www.google.com/search?q=${encodedQuery}\n`;
      formattedResponse += `• Bing: https://www.bing.com/search?q=${encodedQuery}\n`;
      formattedResponse += `• DuckDuckGo: https://duckduckgo.com/?q=${encodedQuery}\n`;
      formattedResponse += `• 百度: https://www.baidu.com/s?wd=${encodedQuery}\n\n`;

      // 3. 特定主题的专业建议
      const lowerQuery = query.toLowerCase();

      if (lowerQuery.includes("tesla") || query.includes("特斯拉")) {
        formattedResponse += `🚗 特斯拉专业资源:\n`;
        formattedResponse += `• 官方网站: https://www.tesla.com\n`;
        formattedResponse += `• 中国官网: https://www.tesla.cn\n`;
        formattedResponse += `• 投资者关系: https://ir.tesla.com\n`;
        formattedResponse += `• 新闻搜索: https://www.google.com/search?q=Tesla+news&tbm=nws\n\n`;
      }

      if (lowerQuery.includes("apple") || query.includes("苹果")) {
        formattedResponse += `🍎 苹果专业资源:\n`;
        formattedResponse += `• 官方网站: https://www.apple.com\n`;
        formattedResponse += `• 中国官网: https://www.apple.com.cn\n`;
        formattedResponse += `• 新闻室: https://www.apple.com/newsroom/\n`;
        formattedResponse += `• 产品发布: https://www.apple.com/apple-events/\n\n`;
      }

      if (
        lowerQuery.includes("ai") ||
        lowerQuery.includes("artificial intelligence") ||
        query.includes("人工智能")
      ) {
        formattedResponse += `🤖 AI 专业资源:\n`;
        formattedResponse += `• Arxiv AI: https://arxiv.org/list/cs.AI/recent\n`;
        formattedResponse += `• AI News: https://www.artificialintelligence-news.com\n`;
        formattedResponse += `• OpenAI: https://openai.com\n`;
        formattedResponse += `• Google AI: https://ai.google\n\n`;
      }

      if (
        lowerQuery.includes("bitcoin") ||
        lowerQuery.includes("crypto") ||
        query.includes("比特币")
      ) {
        formattedResponse += `₿ 加密货币专业资源:\n`;
        formattedResponse += `• CoinMarketCap: https://coinmarketcap.com\n`;
        formattedResponse += `• CoinGecko: https://www.coingecko.com\n`;
        formattedResponse += `• Bitcoin.org: https://bitcoin.org\n`;
        formattedResponse += `• 币圈新闻: https://www.chainnews.com\n\n`;
      }

      // 4. 新闻搜索建议
      if (
        lowerQuery.includes("news") ||
        lowerQuery.includes("latest") ||
        query.includes("新闻") ||
        query.includes("最新")
      ) {
        formattedResponse += `📰 新闻搜索建议:\n`;
        formattedResponse += `• Google News: https://news.google.com/search?q=${encodedQuery}\n`;
        formattedResponse += `• Bing News: https://www.bing.com/news/search?q=${encodedQuery}\n`;
        formattedResponse += `• AllSides: https://www.allsides.com/search?search=${encodedQuery}\n\n`;
      }

      // 5. 学术搜索建议
      if (
        lowerQuery.includes("research") ||
        lowerQuery.includes("paper") ||
        lowerQuery.includes("study") ||
        query.includes("研究") ||
        query.includes("论文")
      ) {
        formattedResponse += `🎓 学术搜索建议:\n`;
        formattedResponse += `• Google Scholar: https://scholar.google.com/scholar?q=${encodedQuery}\n`;
        formattedResponse += `• Arxiv: https://arxiv.org/search/?query=${encodedQuery}\n`;
        formattedResponse += `• ResearchGate: https://www.researchgate.net/search?q=${encodedQuery}\n\n`;
      }

      // 6. 搜索技巧
      if (!hasInstantResults) {
        formattedResponse += `💡 搜索优化技巧:\n`;
        formattedResponse += `• 使用引号搜索精确短语: "确切的词语"\n`;
        formattedResponse += `• 排除词语: 搜索词 -排除词\n`;
        formattedResponse += `• 时间限制: 添加年份 (2024, 2025)\n`;
        formattedResponse += `• 网站限制: site:specific-website.com 搜索词\n`;
      }

      return formattedResponse;
    } catch (error) {
      console.error("Search tool error:", error);
      const encodedQuery = encodeURIComponent(query);
      return (
        `⚠️ 搜索工具遇到问题，但你仍可以直接使用以下链接:\n\n` +
        `🌐 直接搜索:\n` +
        `• Google: https://www.google.com/search?q=${encodedQuery}\n` +
        `• Bing: https://www.bing.com/search?q=${encodedQuery}\n` +
        `• DuckDuckGo: https://duckduckgo.com/?q=${encodedQuery}\n` +
        `• 百度: https://www.baidu.com/s?wd=${encodedQuery}\n\n` +
        `错误信息: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
  },
});
