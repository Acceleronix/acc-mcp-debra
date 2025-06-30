import { tool as createTool } from "ai";
import { z } from "zod";

export const duckduckgoSearchTool = createTool({
  description:
    "Search the web to find current information, news, and answers to questions. Useful for finding recent events, news, product releases, and general information.",
  parameters: z.object({
    query: z.string().describe("The search query to look up"),
    max_results: z
      .number()
      .default(5)
      .describe("Maximum number of results to return (default: 5)"),
  }),
  execute: async ({ query, max_results = 5 }) => {
    try {
      // First try DuckDuckGo instant answer for quick facts
      const instantUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

      const instantResponse = await fetch(instantUrl, {
        headers: { "User-Agent": "WebSearchTool/1.0" },
      });

      let formattedResponse = `搜索结果: "${query}"\n\n`;
      let hasResults = false;

      if (instantResponse.ok) {
        const instantData = await instantResponse.json();

        // Check for instant answers
        if (instantData.AbstractText) {
          formattedResponse += `📖 概述:\n${instantData.AbstractText}\n`;
          if (instantData.AbstractURL) {
            formattedResponse += `来源: ${instantData.AbstractURL}\n`;
          }
          formattedResponse += "\n";
          hasResults = true;
        }

        if (instantData.Answer) {
          formattedResponse += `💡 直接答案:\n${instantData.Answer}\n\n`;
          hasResults = true;
        }

        if (instantData.Definition) {
          formattedResponse += `📚 定义:\n${instantData.Definition}\n`;
          if (instantData.DefinitionURL) {
            formattedResponse += `来源: ${instantData.DefinitionURL}\n`;
          }
          formattedResponse += "\n";
          hasResults = true;
        }

        // Process related topics as search results
        if (instantData.RelatedTopics && instantData.RelatedTopics.length > 0) {
          formattedResponse += `🔗 相关主题:\n`;
          const topics = instantData.RelatedTopics.slice(0, max_results);
          topics.forEach((topic: any, index: number) => {
            if (topic.Text && topic.FirstURL) {
              formattedResponse += `${index + 1}. ${topic.Text}\n   链接: ${topic.FirstURL}\n`;
              hasResults = true;
            }
          });
          formattedResponse += "\n";
        }
      }

      // If no instant results, try to provide a helpful response
      if (!hasResults) {
        formattedResponse += `🔍 搜索建议:\n`;
        formattedResponse += `抱歉，没有找到关于"${query}"的即时结果。\n\n`;
        formattedResponse += `建议尝试:\n`;
        formattedResponse += `• 使用更具体的关键词\n`;
        formattedResponse += `• 使用英文关键词搜索\n`;
        formattedResponse += `• 检查拼写是否正确\n`;
        formattedResponse += `• 尝试使用同义词或相关词汇\n\n`;

        // Provide some general guidance based on query type
        if (query.includes("特斯拉") || query.toLowerCase().includes("tesla")) {
          formattedResponse += `💡 关于特斯拉的建议:\n`;
          formattedResponse += `• 可以搜索 "Tesla latest news"\n`;
          formattedResponse += `• 访问特斯拉官网: https://www.tesla.com\n`;
          formattedResponse += `• 查看特斯拉中国官网: https://www.tesla.cn\n`;
        }

        if (query.includes("新产品") || query.includes("发布")) {
          formattedResponse += `💡 查找产品发布信息的建议:\n`;
          formattedResponse += `• 访问公司官方网站\n`;
          formattedResponse += `• 查看科技新闻网站\n`;
          formattedResponse += `• 搜索产品的英文名称\n`;
        }
      }

      return formattedResponse;
    } catch (error) {
      console.error("Web search error:", error);
      return `搜索失败: ${error instanceof Error ? error.message : "未知错误"}。请尝试使用不同的搜索词。`;
    }
  },
});
