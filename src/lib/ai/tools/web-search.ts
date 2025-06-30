import { tool as createTool } from "ai";
import { z } from "zod";

// 搜索新闻和当前事件的工具
export const webSearchTool = createTool({
  description:
    "Search for current news, recent events, and trending information. Best for finding latest developments, news articles, and recent product releases.",
  parameters: z.object({
    query: z.string().describe("The search query to look up"),
    max_results: z
      .number()
      .default(5)
      .describe("Maximum number of results to return (default: 5)"),
  }),
  execute: async ({ query, max_results = 5 }) => {
    try {
      // 使用多个策略来获取搜索结果
      let formattedResponse = `🔍 搜索结果: "${query}"\n\n`;
      let hasResults = false;

      // 1. 尝试 DuckDuckGo 即时答案
      try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const ddgResponse = await fetch(ddgUrl, {
          headers: { "User-Agent": "WebSearchBot/1.0" },
        });

        if (ddgResponse.ok) {
          const ddgData = await ddgResponse.json();

          if (ddgData.AbstractText) {
            formattedResponse += `📖 概述:\n${ddgData.AbstractText}\n`;
            if (ddgData.AbstractURL) {
              formattedResponse += `来源: ${ddgData.AbstractURL}\n`;
            }
            formattedResponse += "\n";
            hasResults = true;
          }

          if (ddgData.Answer) {
            formattedResponse += `💡 答案:\n${ddgData.Answer}\n\n`;
            hasResults = true;
          }

          if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
            formattedResponse += `🔗 相关信息:\n`;
            const topics = ddgData.RelatedTopics.slice(0, max_results);
            topics.forEach((topic: any, index: number) => {
              if (topic.Text && topic.FirstURL) {
                formattedResponse += `${index + 1}. ${topic.Text}\n   链接: ${topic.FirstURL}\n`;
                hasResults = true;
              }
            });
            formattedResponse += "\n";
          }
        }
      } catch (error) {
        console.warn("DuckDuckGo search failed:", error);
      }

      // 2. 如果没有结果，提供替代搜索建议
      if (!hasResults) {
        formattedResponse += `🔍 搜索建议:\n`;
        formattedResponse += `当前无法直接获取"${query}"的最新搜索结果。\n\n`;

        // 根据查询内容提供针对性建议
        if (query.includes("特斯拉") || query.toLowerCase().includes("tesla")) {
          formattedResponse += `💡 特斯拉相关信息建议:\n`;
          formattedResponse += `• 官方网站: https://www.tesla.com (全球)\n`;
          formattedResponse += `• 中国官网: https://www.tesla.cn\n`;
          formattedResponse += `• 可尝试搜索: "Tesla latest product launch" 或 "Tesla news 2025"\n`;
          formattedResponse += `• 关注特斯拉官方社交媒体获取最新动态\n\n`;
        }

        if (query.includes("苹果") || query.toLowerCase().includes("apple")) {
          formattedResponse += `💡 苹果相关信息建议:\n`;
          formattedResponse += `• 官方网站: https://www.apple.com\n`;
          formattedResponse += `• 苹果中国: https://www.apple.com.cn\n`;
          formattedResponse += `• 查看 Apple Events 页面获取最新发布信息\n\n`;
        }

        if (
          query.includes("新产品") ||
          query.includes("发布") ||
          query.includes("launch") ||
          query.includes("release")
        ) {
          formattedResponse += `💡 查找产品发布信息:\n`;
          formattedResponse += `• 访问公司官方网站的新闻或产品页面\n`;
          formattedResponse += `• 查看科技媒体网站 (如 TechCrunch, The Verge)\n`;
          formattedResponse += `• 关注公司官方社交媒体账号\n`;
          formattedResponse += `• 使用英文关键词可能会有更好的结果\n\n`;
        }

        // 通用搜索建议
        formattedResponse += `🛠️ 搜索优化建议:\n`;
        formattedResponse += `• 使用更具体的关键词\n`;
        formattedResponse += `• 尝试英文搜索词\n`;
        formattedResponse += `• 添加时间限定词 (如 "2025", "最新", "recent")\n`;
        formattedResponse += `• 使用品牌或产品的官方名称\n`;
      }

      return formattedResponse;
    } catch (error) {
      console.error("Web search error:", error);
      return `搜索服务暂时不可用。建议:\n• 稍后重试\n• 直接访问相关官方网站\n• 使用其他搜索引擎\n\n错误信息: ${error instanceof Error ? error.message : "未知错误"}`;
    }
  },
});
