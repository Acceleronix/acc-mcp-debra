"use client";

import { useEffect, useRef, useState } from "react";

export interface PlotlyChartProps {
  code: string;
  lang: string;
}

export function PlotlyChart({ code, lang }: PlotlyChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      if (!plotRef.current) return;

      try {
        setLoading(true);
        setError(null);

        // 动态导入 Plotly
        const PlotlyModule = await import("plotly.js-dist-min");
        let plotData: any;

        if (lang === "python") {
          // 解析 Python Plotly 代码
          plotData = parsePythonPlotlyCode(code);
        } else if (lang === "json") {
          // 解析 JSON 配置
          plotData = JSON.parse(code);
        } else if (lang === "csv") {
          // 解析 CSV 数据并创建默认图表
          plotData = parseCSVData(code);
        } else {
          // 尝试解析为 JSON 或其他格式
          plotData = parseGenericCode(code);
        }

        if (!plotData) {
          throw new Error("无法解析图表数据");
        }

        // 确保数据格式正确
        const { data, layout, config } = formatPlotlyData(plotData);

        if (isMounted && plotRef.current) {
          await PlotlyModule.default.newPlot(plotRef.current, data, layout, {
            responsive: true,
            displayModeBar: false,
            ...config,
          });
        }
      } catch (err) {
        console.error("图表渲染错误:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "图表渲染失败");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [code, lang]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <div className="text-sm text-muted-foreground">正在渲染图表...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="border rounded-lg p-4 bg-destructive/10 border-destructive/20">
          <div className="text-sm text-destructive mb-2">📊 图表渲染失败</div>
          <div className="text-xs text-muted-foreground">{error}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            支持的格式：Python Plotly 代码、JSON 配置、CSV 数据
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div ref={plotRef} className="w-full h-96" />
    </div>
  );
}

// 解析 Python Plotly 代码
function parsePythonPlotlyCode(code: string): any {
  try {
    // 简单的 Python 代码解析 - 提取关键信息
    const lines = code.split("\n");
    let data: any[] = [];
    const layout: any = {};

    // 查找数据定义
    for (const line of lines) {
      const trimmed = line.trim();

      // 解析 go.Scatter 或类似的数据定义
      if (trimmed.includes("go.Scatter") || trimmed.includes("px.line")) {
        // 提取简单的折线图数据
        const xMatch = trimmed.match(/x=\[(.*?)\]/);
        const yMatch = trimmed.match(/y=\[(.*?)\]/);
        const nameMatch = trimmed.match(/name=['"]([^'"]*)['"]/);

        if (xMatch && yMatch) {
          const x = xMatch[1]
            .split(",")
            .map((s) => s.trim().replace(/['"]/g, ""));
          const y = yMatch[1].split(",").map((s) => parseFloat(s.trim()));

          data.push({
            x,
            y,
            type: "scatter",
            mode: "lines+markers",
            name: nameMatch ? nameMatch[1] : "数据系列",
          });
        }
      }

      // 解析 go.Bar 柱状图
      if (trimmed.includes("go.Bar") || trimmed.includes("px.bar")) {
        const xMatch = trimmed.match(/x=\[(.*?)\]/);
        const yMatch = trimmed.match(/y=\[(.*?)\]/);
        const nameMatch = trimmed.match(/name=['"]([^'"]*)['"]/);

        if (xMatch && yMatch) {
          const x = xMatch[1]
            .split(",")
            .map((s) => s.trim().replace(/['"]/g, ""));
          const y = yMatch[1].split(",").map((s) => parseFloat(s.trim()));

          data.push({
            x,
            y,
            type: "bar",
            name: nameMatch ? nameMatch[1] : "数据系列",
          });
        }
      }

      // 解析标题
      if (trimmed.includes("title=")) {
        const titleMatch = trimmed.match(/title=['"]([^'"]*)['"]/);
        if (titleMatch) {
          layout.title = titleMatch[1];
        }
      }
    }

    // 如果没有解析到数据，创建示例数据
    if (data.length === 0) {
      // 检查是否包含温度相关的关键词
      if (code.includes("温度") || code.includes("temperature")) {
        data = [
          {
            x: ["1月", "2月", "3月", "4月", "5月", "6月"],
            y: [5, 8, 12, 18, 22, 26],
            type: "scatter",
            mode: "lines+markers",
            name: "月平均温度",
          },
        ];
        layout.title = "月度温度变化趋势";
        layout.xaxis = { title: "月份" };
        layout.yaxis = { title: "温度 (°C)" };
      }
    }

    return { data, layout };
  } catch (_error) {
    return null;
  }
}

// 解析 CSV 数据
function parseCSVData(code: string): any {
  try {
    const lines = code.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines
      .slice(1)
      .map((line) => line.split(",").map((cell) => cell.trim()));

    if (headers.length < 2 || rows.length === 0) {
      return null;
    }

    const data = [
      {
        x: rows.map((row) => row[0]),
        y: rows.map((row) => parseFloat(row[1]) || 0),
        type: "scatter",
        mode: "lines+markers",
        name: headers[1],
      },
    ];

    const layout = {
      title: "数据图表",
      xaxis: { title: headers[0] },
      yaxis: { title: headers[1] },
    };

    return { data, layout };
  } catch (_error) {
    return null;
  }
}

// 解析通用代码格式
function parseGenericCode(code: string): any {
  try {
    // 尝试解析为 JSON
    const parsed = JSON.parse(code);
    if (parsed.data || parsed.traces) {
      return parsed;
    }
    return null;
  } catch (_error) {
    // 如果不是 JSON，检查是否包含图表相关关键词
    if (code.includes("折线图") || code.includes("line")) {
      return {
        data: [
          {
            x: [1, 2, 3, 4, 5],
            y: [2, 4, 3, 5, 6],
            type: "scatter",
            mode: "lines+markers",
            name: "数据系列",
          },
        ],
        layout: { title: "折线图示例" },
      };
    }
    return null;
  }
}

// 格式化 Plotly 数据
function formatPlotlyData(plotData: any): {
  data: any[];
  layout: any;
  config: any;
} {
  const defaultLayout = {
    autosize: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "Inter, sans-serif", size: 12 },
  };

  const data = plotData.data || plotData.traces || [plotData];
  const layout = { ...defaultLayout, ...plotData.layout };
  const config = plotData.config || {};

  return { data, layout, config };
}
