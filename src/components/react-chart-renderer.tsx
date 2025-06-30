"use client";

import { useEffect, useRef, useState } from "react";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";

export interface ReactChartRendererProps {
  code: string;
  lang: string;
}

export function ReactChartRenderer({ code, lang }: ReactChartRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<Root | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const renderReactComponent = async () => {
      if (!containerRef.current) return;

      try {
        setLoading(true);
        setError(null);

        // 动态导入 Babel 进行 JSX 转换
        const Babel = await import("@babel/standalone");

        // 准备组件代码
        let componentCode = code;

        // 如果代码包含 import 语句，需要处理
        if (componentCode.includes("import")) {
          // 移除 import 语句，因为我们直接提供依赖
          componentCode = componentCode
            .split("\n")
            .filter((line) => !line.trim().startsWith("import"))
            .join("\n");
        }

        // 确保代码导出组件
        if (!componentCode.includes("export default")) {
          componentCode += "\n\nexport default SimUsageChart;";
        }

        // 转换 JSX 到 JavaScript
        const transformedCode = Babel.transform(componentCode, {
          presets: ["react", "env"],
          plugins: ["transform-modules-commonjs"],
        }).code;

        // 创建一个安全的执行环境
        const moduleExports: any = {};
        const moduleObject = { exports: moduleExports };

        // 创建执行函数
        const executeCode = new Function(
          "React",
          "LineChart",
          "Line",
          "XAxis",
          "YAxis",
          "CartesianGrid",
          "Tooltip",
          "Legend",
          "ResponsiveContainer",
          "BarChart",
          "Bar",
          "PieChart",
          "Pie",
          "Cell",
          "ComposedChart",
          "Area",
          "AreaChart",
          "module",
          "exports",
          transformedCode || "",
        );

        // 执行代码并获取组件
        executeCode(
          React,
          LineChart,
          Line,
          XAxis,
          YAxis,
          CartesianGrid,
          Tooltip,
          Legend,
          ResponsiveContainer,
          BarChart,
          Bar,
          PieChart,
          Pie,
          Cell,
          ComposedChart,
          Area,
          AreaChart,
          moduleObject,
          moduleExports,
        );

        const Component = moduleExports.default || moduleExports.SimUsageChart;

        if (!Component) {
          throw new Error("无法找到组件导出");
        }

        // 清理之前的根节点
        if (rootRef.current) {
          rootRef.current.unmount();
          rootRef.current = null;
        }

        if (isMounted && containerRef.current) {
          // 清空容器
          containerRef.current.innerHTML = "";

          // 创建新的根节点并渲染组件
          rootRef.current = createRoot(containerRef.current);
          rootRef.current.render(React.createElement(Component));
        }
      } catch (err) {
        console.error("React 组件渲染错误:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "组件渲染失败");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    renderReactComponent();

    return () => {
      isMounted = false;
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
    };
  }, [code, lang]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
          <div className="text-sm text-muted-foreground">
            正在渲染 React 组件...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="border rounded-lg p-4 bg-destructive/10 border-destructive/20">
          <div className="text-sm text-destructive mb-2">
            ⚛️ React 组件渲染失败
          </div>
          <div className="text-xs text-muted-foreground mb-2">{error}</div>
          <div className="text-xs text-muted-foreground">
            支持的图表库：Recharts (LineChart, BarChart, PieChart, AreaChart)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div ref={containerRef} className="w-full min-h-[400px]" />
    </div>
  );
}
