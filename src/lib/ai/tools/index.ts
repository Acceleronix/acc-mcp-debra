import { createPieChartTool } from "./create-pie-chart";
import { createBarChartTool } from "./create-bar-chart";
import { createLineChartTool } from "./create-line-chart";
import { webSearchTool } from "./web-search";
import { DefaultToolName } from "./app-default-tool-name";
import { AppDefaultToolkit } from "app-types/chat";

export const defaultTools = {
  [AppDefaultToolkit.Visualization]: {
    [DefaultToolName.CreatePieChart]: createPieChartTool,
    [DefaultToolName.CreateBarChart]: createBarChartTool,
    [DefaultToolName.CreateLineChart]: createLineChartTool,
  },
  [AppDefaultToolkit.WebSearch]: {
    [DefaultToolName.DuckDuckGoSearch]: webSearchTool,
  },
};
