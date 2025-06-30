"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Markdown } from "@/components/markdown";

const sampleMarkdownCode = `\`\`\`markdown
# 这是一个 Markdown 示例

这是一个 **Markdown** 代码块的演示，现在支持预览功能！

## 功能特性

- ✅ 实时预览
- ✅ 代码高亮
- ✅ 安全渲染

### 代码示例

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### 表格示例

| 功能 | 状态 |
|------|------|
| Markdown 渲染 | ✅ |
| HTML 渲染 | ✅ |

> 这是一个引用块示例
\`\`\``;

const sampleHtmlCode = `\`\`\`html
<div>
  <h1>HTML 预览示例</h1>
  
  <p>这是一个 <strong>HTML</strong> 代码块的演示。</p>
  
  <h2>支持的功能</h2>
  
  <ul>
    <li>代码高亮显示</li>
    <li>实时预览渲染</li>
    <li>安全 HTML 过滤</li>
    <li>响应式设计</li>
  </ul>
  
  <blockquote>
    <p>这是一个引用块，通过 DOMPurify 进行安全过滤。</p>
  </blockquote>
  
  <h3>表格示例</h3>
  
  <table>
    <thead>
      <tr>
        <th>功能</th>
        <th>状态</th>
        <th>说明</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>代码高亮</td>
        <td>✅</td>
        <td>使用 Shiki</td>
      </tr>
      <tr>
        <td>HTML 预览</td>
        <td>✅</td>
        <td>安全渲染</td>
      </tr>
      <tr>
        <td>Markdown 预览</td>
        <td>✅</td>
        <td>实时渲染</td>
      </tr>
    </tbody>
  </table>
  
  <p>链接示例：<a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></p>
</div>
\`\`\``;

const regularCode = `\`\`\`javascript
// 这是普通的 JavaScript 代码块，不会显示预览标签
function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 3);
console.log("计算结果:", result);

// 支持的其他功能
const data = {
  name: "测试",
  type: "demo",
  features: ["语法高亮", "复制功能", "主题切换"]
};
\`\`\``;

export default function CodePreviewTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">代码块预览功能测试</h1>
        <p className="text-muted-foreground">
          测试 HTML 和 Markdown 代码块的 Code/Preview 切换功能
        </p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Markdown 代码块预览</CardTitle>
            <CardDescription>
              支持 Code 和 Preview 两种视图切换，可以查看 Markdown
              原始代码和渲染效果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Markdown>{sampleMarkdownCode}</Markdown>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HTML 代码块预览</CardTitle>
            <CardDescription>
              支持安全的 HTML 预览，自动过滤危险内容并渲染HTML效果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Markdown>{sampleHtmlCode}</Markdown>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>普通代码块对比</CardTitle>
            <CardDescription>
              其他语言的代码块保持原有的显示方式，只有复制功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Markdown>{regularCode}</Markdown>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold">功能说明</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium mb-2">新增功能</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• HTML/Markdown 代码块支持 Code/Preview 切换</li>
              <li>• Preview 标签页显示渲染后的效果</li>
              <li>• Code 标签页显示语法高亮的源码</li>
              <li>• 保留原有的复制功能</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">安全特性</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• HTML 内容通过 DOMPurify 安全过滤</li>
              <li>• 移除所有危险标签和事件处理器</li>
              <li>• Markdown 使用现有的安全渲染组件</li>
              <li>• 其他代码语言保持原有显示方式</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
