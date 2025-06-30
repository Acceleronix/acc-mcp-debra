import { tool as createTool } from "ai";
import { z } from "zod";

export const duckduckgoSearchTool = createTool({
  description:
    "Search the web using DuckDuckGo to find current information, news, and answers to questions",
  parameters: z.object({
    query: z.string().describe("The search query to look up"),
    max_results: z
      .number()
      .default(10)
      .describe("Maximum number of results to return (default: 10)"),
  }),
  execute: async ({ query, max_results = 10 }) => {
    try {
      // Use DuckDuckGo instant answer API
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "DuckDuckGoMCP/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status}`);
      }

      const data = await response.json();

      // Format results for LLM consumption
      const results = {
        query,
        instant_answer: data.AbstractText || null,
        definition: data.Definition || null,
        answer: data.Answer || null,
        infobox: data.Infobox || null,
        related_topics:
          data.RelatedTopics?.slice(0, max_results).map((topic: any) => ({
            text: topic.Text,
            url: topic.FirstURL,
          })) || [],
        results:
          data.Results?.slice(0, max_results).map((result: any) => ({
            title: result.Text,
            url: result.FirstURL,
          })) || [],
      };

      // Format response for better readability
      let formattedResponse = `Search results for: "${query}"\n\n`;

      if (results.instant_answer) {
        formattedResponse += `📖 Quick Answer:\n${results.instant_answer}\n\n`;
      }

      if (results.answer) {
        formattedResponse += `💡 Direct Answer:\n${results.answer}\n\n`;
      }

      if (results.definition) {
        formattedResponse += `📚 Definition:\n${results.definition}\n\n`;
      }

      if (results.related_topics.length > 0) {
        formattedResponse += `🔗 Related Topics:\n`;
        results.related_topics.forEach((topic, index) => {
          if (topic.text && topic.url) {
            formattedResponse += `${index + 1}. ${topic.text}\n   Link: ${topic.url}\n`;
          }
        });
        formattedResponse += "\n";
      }

      if (results.results.length > 0) {
        formattedResponse += `🔍 Search Results:\n`;
        results.results.forEach((result, index) => {
          if (result.title && result.url) {
            formattedResponse += `${index + 1}. ${result.title}\n   Link: ${result.url}\n`;
          }
        });
      }

      if (
        !results.instant_answer &&
        !results.answer &&
        !results.definition &&
        results.related_topics.length === 0 &&
        results.results.length === 0
      ) {
        formattedResponse +=
          "No search results found. Try rephrasing your query or using different keywords.";
      }

      return formattedResponse;
    } catch (error) {
      console.error("DuckDuckGo search error:", error);
      return `Search failed: ${error instanceof Error ? error.message : "Unknown error"}. Please try again with a different query.`;
    }
  },
});
